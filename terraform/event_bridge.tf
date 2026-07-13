resource "aws_cloudwatch_event_rule" "hourly_trigger" {
  name                = "${var.function_name}-hourly-trigger"
  description         = "Trigger Lambda function every hour at 30 minutes past"
  schedule_expression = "cron(30 * * * ? *)" # Every hour at 30 minutes past
}

resource "aws_cloudwatch_event_target" "lambda_target" {
  rule      = aws_cloudwatch_event_rule.hourly_trigger.name
  target_id = "TriggerLambdaTarget"
  arn       = aws_lambda_function.weather_collector.arn
}

resource "aws_lambda_permission" "allow_eventbridge_invoke" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.weather_collector.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.hourly_trigger.arn
}
