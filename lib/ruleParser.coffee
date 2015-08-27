jsep = require "jsep"
jsep.addBinaryOp("|", 1);
jsep.addBinaryOp("&", 2);

LITERAL_PLACEHOLDER = "0"

parseRules = (rules) ->
  restrictions = rules.split /[\|&]/
  jsepInput = rules.replace /[^\|&]+/g, LITERAL_PLACEHOLDER
  tree = jsep jsepInput
  fillTreeRestrictions tree, restrictions
  tree

fillTreeRestrictions = (tree, restrictions) ->
  if tree.left.type == "Literal"
    fillLeafRestriction tree.left, restrictions.shift()
  else
    fillTreeRestrictions tree.left, restrictions

  if tree.right.type == "Literal"
    fillLeafRestriction tree.right, restrictions.shift()
  else
    fillTreeRestrictions tree.right, restrictions

fillLeafRestriction = (leaf, restriction) ->
  leaf.type = "Restriction"

  splittedRestriction = restriction.split "="

  leaf.param = splittedRestriction[0]
  leaf.value = splittedRestriction[1]

  delete leaf.raw

module.exports =
  parse: parseRules
