#2025 19 03

import json
import boto3

dynamodb = boto3.resource("dynamodb")
device_reg_table = dynamodb.Table("DeviceRegistrations")
user_config_table = dynamodb.Table("user_configs")


def validate_device(user_id, device_id):
    """Validate device by scanning DeviceRegistrations table for matching UserId and SerialNumber."""
    print(f"🔍 Validating device for user {user_id}")

    # Scan the entire table (since we can't query by UserId)
    response = device_reg_table.scan()

    if "Items" not in response or not response["Items"]:
        print(f"❌ No device registration records found.")
        return False  # Invalid device

    # Check if any record matches user_id and device_id
    for device in response["Items"]:
        if device["UserId"] == user_id and device["SerialNumber"] == device_id:
            print(f"✅ Device valid for user {user_id}")
            return True  # Device is valid

    print(f"❌ Device mismatch for user {user_id}")
    return False


def lambda_handler(event, context):
    """Handles config retrieval request from device."""
    print("🚀 Handling config request...")

    try:
        body = json.loads(event["body"])
        user_id = body.get("user_id")

        # Support both device_id and device_token for backward compatibility
        device_id = body.get("device_id")
        device_token = body.get("device_token")

        # Use device_id if provided, otherwise fall back to device_token
        identifier = device_id if device_id else device_token

        config_type = body.get("configType")  # "flights", "finance", etc.

        print("passed json body: ", body)
        print("passed identifier: ", identifier)

        if not user_id or not identifier or not config_type:
            return {"statusCode": 400, "body": json.dumps({"error": "Missing parameters"})}

        # ✅ Validate the device before fetching config
        if not validate_device(user_id, identifier):
            return {"statusCode": 401, "body": json.dumps({"error": "Unauthorized: Invalid device"})}

        # ✅ Fetch only selected configurations
        print(f"🔍 Fetching selected {config_type} config for user {user_id}")
        response = user_config_table.query(
            KeyConditionExpression="UserID = :user_id",
            FilterExpression="ConfigType = :config_type AND isSelected = :selected",
            ExpressionAttributeValues={
                ":user_id": user_id,
                ":config_type": config_type,
                ":selected": True,  # Only return active configurations
            }
        )

        configs = response.get("Items", [])

        if not configs:
            print(f"❌ No active configuration found for {user_id} and type {config_type}")
            return {"statusCode": 404, "body": json.dumps({"error": "No active configuration found"})}

        print(f"✅ Returning {len(configs)} configurations for {user_id}")
        return {"statusCode": 200, "body": json.dumps(configs)}

    except Exception as e:
        print(f"❌ Error: {e}")
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}