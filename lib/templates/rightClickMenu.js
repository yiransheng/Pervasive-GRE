(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['rightClickMenu'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div id=\"pgre-right-click\">\n    <ul>\n      <li><a href='"
    + escapeExpression(((stack1 = ((stack1 = depth0.urls),stack1 == null || stack1 === false ? stack1 : stack1.google)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "'>Google</a></li>\n      <li><a href='"
    + escapeExpression(((stack1 = ((stack1 = depth0.urls),stack1 == null || stack1 === false ? stack1 : stack1.wikipedia)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "'>Wikipedia</a></li>\n      <li><a href='"
    + escapeExpression(((stack1 = ((stack1 = depth0.urls),stack1 == null || stack1 === false ? stack1 : stack1.thesaurus)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "'>Thesaurus</a></li>\n    </ul>\n</div>\n";
  return buffer;
  });
})();