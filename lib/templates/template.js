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
templates['pgre-main'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n<div class=\"pgre-word-wrapper\">\n  <p class=\"pgre-word\">";
  if (stack1 = helpers.word) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.word; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</p>\n  <p class=\"pgre-def\">";
  if (stack1 = helpers.def) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.def; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "></p>\n  <div class=\"pgre-dropdown\">Example sentences on this page ("
    + escapeExpression(((stack1 = ((stack1 = depth0.sentences),stack1 == null || stack1 === false ? stack1 : stack1.length)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ")</div>\n  <div class=\"pgre-sentences\">\n  ";
  stack2 = helpers.each.call(depth0, depth0.sentences, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n  </div>\n</div>\n";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "";
  buffer += "\n    <p>"
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + "</p>\n  ";
  return buffer;
  }

  buffer += "<div class='pgre-title'>Pervasive GRE detected the following words on this page:</div>\n";
  stack1 = helpers.each.call(depth0, depth0.words, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n";
  return buffer;
  });
})();
