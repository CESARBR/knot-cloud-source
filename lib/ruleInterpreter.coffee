_ = require "lodash"
util = require "util"
moment = require "moment" # Library to deal with time
parser = require './ruleParser'

# Error messages
UNKNOWN_OPERATOR_ERROR = "Evaluation Error: Unknown operator '%s'."
UNKNOWN_TYPE_ERROR = "Evaluation Error: A node of an unknown type '%s' was found."
UNKNOWN_PARAMETER_ERROR = "Evaluation Error: The parameter '%s' is not supported."
INVALID_ARGS_FORMAT = "Evaluation Error: Invalid arguments format. Expected format was %s"

# Argument formats
TIME_ARGS_FORMAT = "'hh:mm - hh:mm'"
DATE_ARGS_FORMAT = "'[month/]day[/year][-[month/]day[/year]]'; a) Year must have 4 digits. b) You can use 'null' instad of a date to specify indefiniteness."
DAY_ARGS_FORMAT = "'week_day[, another_week_day[, ...]]'"

restrictions =
	time : (value) ->
		throw new Error util.format INVALID_ARGS_FORMAT, TIME_ARGS_FORMAT unless \
				value.match /^\s*\d{1,2}\s*:\s*\d{1,2}\s*-\s*\d{1,2}\s*:\s*\d{1,2}\s*$/
		[fromTime, toTime] = value.split "-"
		fromTime = moment(fromTime, "h:m")
		toTime = moment(toTime, "h:m")
		now = moment()
		result = (fromTime.isBefore now) and (now.isBefore toTime)
		return result
	day : (value) ->
		throw new Error util.format INVALID_ARGS_FORMAT, DAY_ARGS_FORMAT unless \
				value.match /^\s*\w+(?:\s*,\s*\w+)*\s*$/
		days = value.split ","
		days = _.map days, (str) -> str.toString().trim().substring(0, 3).toLowerCase()
		return _.includes days, moment().format("ddd").toLowerCase()
	date : (value) ->
		throw new Error util.format INVALID_ARGS_FORMAT, DATE_ARGS_FORMAT unless \
				value.match /^\s*(?:\d{1,2}(?:\s*\/\s*\d{1,2}(?:\s*\/\s*\d{1,4})?)?|null)(?:\s*-\s*(?:\d{1,2}(?:\s*\/\s*\d{1,2}(?:\s*\/\s*\d{1,4})?)?|null))?\s*$/
		[fromDate, toDate] = value.split "-"
		toDate ?= fromDate
		fromDate = "01/01" if fromDate == "null" # an aways true minimum date: the first day of the year
		toDate = "12/31" if toDate == "null" # an aways true maximum date: the last day of the year
		fromDate = strToMomentDate fromDate
		toDate = strToMomentDate toDate
		now = moment()
		return fromDate.isValid() and (fromDate.isBefore now) and
				toDate.isValid() and (now.isBefore toDate.add 1, 'd')

strToMomentDate = (str) ->
	switch (str.match(/\//g) || []).length
		when 0 then moment str, "DD"
		when 1 then moment str, "MM-DD"
		when 2 then moment str, "MM-DD-YYYY"

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
	else if condition.type == "Compound"
		return true
	else
		throw new Error util.format UNKNOWN_TYPE_ERROR, condition.type

evaluate = (condition, callback) ->
	try
		result = recursive_evaluate condition
		callback null, result
	catch error
		callback error, null

parseAndEvaluate = (condition, callback) ->
	parser.parse condition, (e, r) ->
		if e? then callback e, null else evaluate r, callback

module.exports = 
	evaluate : evaluate
	parseAndEvaluate : parseAndEvaluate
