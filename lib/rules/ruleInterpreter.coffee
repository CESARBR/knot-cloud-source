_ = require "lodash"
util = require "util"
moment = require "moment" # Library to deal with time
parser = require './ruleParser'

# Error messages
UNKNOWN_OPERATOR_ERROR = "Evaluation Error: Unknown operator '%s'."
UNKNOWN_TYPE_ERROR = "Evaluation Error: A node of an unknown type '%s' was found."
UNKNOWN_PARAMETER_ERROR = "Evaluation Error: The parameter '%s' is not supported."
INVALID_ARGS_FORMAT = "Evaluation Error: Invalid arguments format. Expected format was %s"
INVALID_DATE = "Evaluation Error: '%s' is not a valid date."

# Argument formats
TIME_ARGS_FORMAT = "'hh:mm - hh:mm'"
DATE_ARGS_FORMAT = "'[month/]day[/year][-[month/]day[/year]]'; a) Year must have 4 digits. b) You can use 'null' instad of a date to specify indefiniteness."
DAY_ARGS_FORMAT = "'week_day[, another_week_day[, ...]]'; each week_day may be one of [sun, mon, tue, wed, thu, fri, sat], case insensitive."

# Receives a generic string date and transforms it to a moment object.
# Parameter 'str' must be one of the formats: "DD", "MM/DD" or "MM/DD/YYYY.
strToMomentDate = (str) ->
	result =
		switch (str.match(/\//g) || []).length
			when 0 then moment str, "DD"
			when 1 then moment str, "MM-DD"
			when 2 then moment str, "MM-DD-YYYY"
	throw new Error util.format INVALID_DATE, str unless result.isValid()

# A map of the functions that evaluate each specific parameter in a condition to be evaluated.
# Each of these functions must receive only a string parameter and return a boolean.
restrictions =

	# Validates if the current time is withing a given range.
	time : (value) ->
		value = value.replace /\s*/g, ""
		throw new Error util.format INVALID_ARGS_FORMAT, TIME_ARGS_FORMAT unless \
				value.match /^\d{1,2}:\d{1,2}-\d{1,2}:\d{1,2}$/
		[fromTime, toTime] = value.split "-"
		fromTime = moment(fromTime, "h:m")
		toTime = moment(toTime, "h:m")
		now = moment()
		result = (fromTime.isBefore now) and (now.isBefore toTime)
		return result

	# Validates if today is a specific day in the week.
	day : (value) ->
		value = value.replace /\s*/g, ""
		throw new Error util.format INVALID_ARGS_FORMAT, DAY_ARGS_FORMAT unless \
				value.match /^\w+(?:,\w+)*$/
		days = value.split ","
		days = _.map days, (str) -> str.toString().trim().substring(0, 3).toLowerCase()
		return _.includes days, moment().format("ddd").toLowerCase()

	# Validates if today is a specific date or within a range of two dates.
	date : (value) ->
		value = value.replace /\s*/g, ""
		throw new Error util.format INVALID_ARGS_FORMAT, DATE_ARGS_FORMAT unless \
				value.match /// ^													# Begin of string
								(?:\d{1,2}(?:\/\d{1,2}(?:\/\d{1,4})?)?|null)		# A 'MM/DD/YYYY' formatted date or null
								(?:-												# Possible range indicator hyphen
									(?:\d{1,2}(?:\/\d{1,2}(?:\/\d{1,4})?)?|null)	# Another date in the same format or null
								)?
							$ ///													# End of string
		[fromDate, toDate] = value.split "-"
		toDate ?= fromDate
		fromDate = "01/01" if fromDate == "null" # an aways true minimum date: the first day of the year
		toDate = "12/31" if toDate == "null" # an aways true maximum date: the last day of the year
		fromDate = strToMomentDate fromDate
		toDate = strToMomentDate toDate
		now = moment()
		return (fromDate.isBefore now) and (now.isBefore toDate.add 1, 'd')

# Internal recursive function called by 'evaluate' to evaluate each node of a condition recursively.
recursive_evaluate = (condition) ->
	# If the current node is a binary expession ('and' or 'or' expression)
	if condition.type == "BinaryExpression"
		if condition.operator == "|"
			return (recursive_evaluate condition.left) or (recursive_evaluate condition.right)
		else if condition.operator == "&"
			return (recursive_evaluate condition.left) and (recursive_evaluate condition.right)
		else
			throw new Error util.format UNKNOWN_OPERATOR_ERROR, condition.operator
	# If the current node is a condition, call the function that will evaluate it.
	else if condition.type == "Restriction"
		handlerFunction = condition.param.toString().toLowerCase()
		if restrictions[handlerFunction]?
			return restrictions[handlerFunction] condition.value
		else
			throw new Error util.format UNKNOWN_PARAMETER_ERROR, condition.param
	# A compound node will be found only if all the expression is empty.
	# In this case, there's no restriction and the condition will always return true.
	else if condition.type == "Compound"
		return true
	# Error for unkown node type found.
	else
		throw new Error util.format UNKNOWN_TYPE_ERROR, condition.type

# Evaluates a condition received and call the callback for the result.
# The 'condition' must be a tree object parsed with 'ruleParser.coffee'
evaluate = (condition, callback) ->
	try
		result = recursive_evaluate condition
		callback null, result
	catch error
		callback error, null

# Convenient function that accepts a condition in string format and internally calls the ruleParser.
parseAndEvaluate = (condition, callback) ->
	parser.parse condition, (e, r) ->
		if e? then callback e, null else evaluate r, callback

module.exports = 
	evaluate : evaluate
	parseAndEvaluate : parseAndEvaluate
