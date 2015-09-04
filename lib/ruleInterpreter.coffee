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
# Parameter str is expected to be a string that representes a date in one of the bellow formats:
# > "DD" for a specific day of month. The month and year of the moment object are filled with the current month and year. Ex: "26" for this month's 26th day.
# > "MM/DD" for a specific date of a month. The year of the moment object are filled with the current year. Ex: "04/26" for the date April 26th of the current year.
# > "MM/DD/YYYY" for a specific date. Ex: "04/26/1991" for the date April 26th of 1991.
# This function will throw  an error if the date argument is invalid. Ex: "2/29/2015" or "13/38".
strToMomentDate = (str) ->
	result =
		switch (str.match(/\//g) || []).length
			when 0 then moment str, "DD"
			when 1 then moment str, "MM-DD"
			when 2 then moment str, "MM-DD-YYYY"
	throw new Error util.format INVALID_DATE, str unless result.isValid()

# A map of the functions that evaluate each specific parameter in a condition to be evaluated.
# Each of these functions receives a single string parameter with the condition to be evaluated and
# returns a boolean value indicatin the result of the evaluation.
# They may also throw an Error object if the 'value' argument is malformed.
restrictions =

	# Validates if the current time is withing a given range.
	# Expected format for 'value' is 'hh:mm-hh:mm'
	# Ex: "07:0-12:00"
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
	# Expected format for 'value' is any number of week days separated by comma.
	# Each week day may be one of [sun, mon, tue, wed, thu, fri, sat], case insensitive.
	# Alternatively this method accepts the full name of the a day.
	# Ex: "mon, wed, fri" or "Monday, Wednesday, Saturday"
	day : (value) ->
		value = value.replace /\s*/g, ""
		throw new Error util.format INVALID_ARGS_FORMAT, DAY_ARGS_FORMAT unless \
				value.match /^\w+(?:,\w+)*$/
		days = value.split ","
		days = _.map days, (str) -> str.toString().trim().substring(0, 3).toLowerCase()
		return _.includes days, moment().format("ddd").toLowerCase()

	# Validates if today is a specific date or within a range of two dates.
	# Expected format for 'value' is versatile enought to support a single date or
	# a range of two dates separated by a hyphen.
	# Each date can have a single number specifying a date of any month; or
	# Date and month, specifying a date of a month for each year; or
	# A full date with day, month and year; or
	# The word 'null', specifying no minimum or maximum limit for the range.
	# Examples:
	# > "5" will be true for each 5th day of any month.
	# > "01/01" will be true for January 1st of each year.
	# > "7/12/2015" will be true only for July 12th of 2015.
	# > "02/15/2015-03/10/2015" will be true for this specific period only.
	# > "4/1-4/30" will be true for April 1st to April 30th of any year.
	# > "10/1/2015-null" will be true beginning from October 1st of 2015 and so on.
	# > "null-10/1/2015" will be true until October 1st of 2015.
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

# Evaluates a condition tree and call the callback for the result.
# Paramter 'condition' is the expression to be evaluated. It should be already parsed to a tree
# format using ruleParser.coffee.
# Paratemer 'callback' must be a function with two parameters: (error, result)
# 'error' is a possible error found while evaluating the expression or null if none occurs.
# 'result' is a boolean true or false for the result of the evaluation or null if an error occured.
evaluate = (condition, callback) ->
	try
		result = recursive_evaluate condition
		callback null, result
	catch error
		callback error, null

# Convenient function that accepts a condition in string format and internally calls the ruleParser.
# The 'condition' parameter is expected to be in the same format as expected for the 'parse'
# function of the ruleParser.
# The callback is expected to be in the same format as expected for the 'evaluate' function.
parseAndEvaluate = (condition, callback) ->
	parser.parse condition, (e, r) ->
		if e? then callback e, null else evaluate r, callback

module.exports = 
	evaluate : evaluate
	parseAndEvaluate : parseAndEvaluate
