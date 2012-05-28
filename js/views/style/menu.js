define([
  'jquery',
  'underscore',
  'backbone',
  'text!templates/style/menu.html',
  'jscssp',
  'config'
], function($, _, Backbone, dashboardPageTemplate, jscssp, config){
  var DashboardPage = Backbone.View.extend({
    el: '.style-menu',
    initialize: function() {
      var files = config.files || ["style.css"],
          loadStatuses = [];
      _.bindAll(this, "render");
      this.$el.html('Loading styles');
      this.importRules = [];

      _.each(files, function(filename) {
        var loaded = $.Deferred();
        require(['text!' + config.css_path + '/' + filename], this.readSheet.bind(this, loaded));
        loadStatuses.push(loaded);
        this.importRules.push({ type: 3, href: "url( " + filename + " )" });
      }.bind(this));


      $.when.apply($, loadStatuses).then(this.render);
    },
    render: function () {
      this.$el.html(_.template(dashboardPageTemplate, {_:_, importRules: this.importRules}));
      $('[href="' + window.location.hash + '"]').addClass('active');
    },
    readSheet: function(loaded, styles) {
      var parser = new jscssp();
      var sheet = parser.parse(styles, false, true);
      var rules = _.map(sheet.cssRules, this.readMeta);

      var importRules = _.filter(sheet.cssRules, function (rule) {
        if(rule.type === 3){
          return true;
        } 
        if(rule.type === 101 && typeof rule.metadata.category !== 'undefined') {
          return true;
        }
      });
      this.importRules = this.importRules.concat(importRules);

      loaded.resolve();
    },
    readMeta: function(rule) {
      var cssObj = {};
      if(rule.type === 101) {
        var css = rule.parsedCssText;
        css = css.replace('/*', '');
        css = css.replace('*/', '');
        var cssLines = css.split('\n');
        _.each(cssLines, function(line){
          var splits = line.match(/([^:]*)\:(.*)/);
          if(splits !== null) {
            cssObj[splits[1].toLowerCase()] = splits[2];
          }
        });
      }
      rule.metadata = cssObj;
      return rule;
    },
    events: {
      'click a': function (ev) {
        this.$el.find('a.active').removeClass('active');
        $(ev.currentTarget).addClass('active');
      }
    }
  });
  return DashboardPage;
});
