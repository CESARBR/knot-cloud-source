util = require "util"
moment = require "moment" # Library to deal with time

# Error messages
UNKNOWN_OPERATOR_ERROR = "Evaluation Error: Unknown operator '%s'."
UNKNOWN_TYPE_ERROR = "Evaluation Error: A node of an unknown type '%s' was found."
UNKNOWN_PARAMETER_ERROR = "Evaluation Error: The parameter '%s' is not supported."

restrictions =
	time : (value) ->
		[fromTime, toTime] = value.split "-"
		fromTime = moment(fromTime, "h:m")
		toTime = moment(toTime, "h:m")
		now = moment()
		result = (fromTime.isBefore now) and (now.isBefore toTime)
		return result

recursive_evaluate = (condition) ->
	if condition.type == "BinaryExpression"
		if condition.operator == "|"
			return (recursive_evaluate condition.left) or (recursive_evaluate condition.right)
		else if condition.operator == "&"
			return (recursive_evaluate condition.left) and (recursive_evaluate condition.right)
		else
			throw new Error util.format UNKNOWN_OPERATOR_ERROR, condition.operator
	else if condition.type == "Restriction"
		if restrictions[condition.param]?
			return restrictions[condition.param] condition.value
		else
			throw new Error util.format UNKNOWN_PARAMETER_ERROR, condition.param
	else
		throw new Error util.format UNKNOWN_TYPE_ERROR, condition.type

evaluate = (condition, callback) ->
	try
		result = recursive_evaluate condition
		callback null, result
	catch error
		callback error, null

module.exports = 
	evaluate : evaluate