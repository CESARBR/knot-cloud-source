_ = require "lodash"
jsep = require "jsep"
util = require "util"

# Error messages
PARAM_WITHOUT_VALUE_MESSAGE = "Syntax Error: Condition '%s' doesn't contains an '=' character."

# Constants
LITERAL_PLACEHOLDER = "0"

setupJsep = () ->
  jsep.addBinaryOp("|", 1);
  jsep.addBinaryOp("&", 2);

# Parses a restriction from the string format stored in the whitelists of the
# devices to a tree that will be used by the ruleInterpreter.
parseRules = (rules, callback) ->
  restrictions = rules.split /[\|&]/
  jsepInput = rules.replace /[^\|&]+/g, LITERAL_PLACEHOLDER
  try
    tree = jsep jsepInput
    fillTreeRestrictions tree, restrictions
    callback null, tree
  catch error
    callback error, null

# Internal function used to adapt the tree that the jsep library created to the format expected
# by the interpreter. This is a recursive function that iterates over the tree and calls
# fillTreeRestrictions function for each leaf node found.
fillTreeRestrictions = (tree, restrictions) ->
  if tree.type == "BinaryExpression"
    fillTreeRestrictions tree.left, restrictions
    fillTreeRestrictions tree.right, restrictions
  else if tree.type == "Literal"
    fillLeafRestriction tree, restrictions.shift()

# Changes a leaf node to the format expected by the interpreter.
fillLeafRestriction = (leaf, restriction) ->
  leaf.type = "Restriction"
  [leaf.param, leaf.value] = _.map restriction.split("="), (str) -> str.trim()
  throw new Error util.format PARAM_WITHOUT_VALUE_MESSAGE, restriction unless leaf.param? and leaf.value?
  delete leaf.raw

setupJsep()

module.exports =
  parse: parseRules
