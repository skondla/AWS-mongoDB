{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "(000F) Deploy MongoDB on a New VPC in AWS",
  "Parameters": {
    "VPCCIDR": {
      "Description": "CIDR Block for the VPC you are creating.",
      "Type": "String",
      "Default": "10.0.0.0/16",
      "AllowedPattern": "[a-zA-Z0-9]+\\..+"
    },
    "RemoteAccessCIDR": {
      "Description": "IP CIDR from where you could SSH into MongoDB cluster via NAT",
      "Type": "String",
      "MinLength": "9",
      "MaxLength": "18",
      "Default": "0.0.0.0/0",
      "AllowedPattern": "(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})/(\\d{1,2})",
      "ConstraintDescription": "must be a valid CIDR range of the form x.x.x.x/x."
    },
    "ClusterReplicaSetCount": {
      "Description": "Number of Replica Set Members. Choose 1 or 3",
      "Type": "String",
      "Default": "1",
      "AllowedValues": [
        "1",
        "3"
      ]
    },
    "ClusterShardCount": {
      "Description": "Number of Shards [0,1,2,3]. 0==No Sharding. Set to > 1 for Sharding",
      "Type": "String",
      "Default": "0",
      "AllowedValues": [
        "0",
        "1",
        "2",
        "3"
      ]
    },
    "MongoDBVersion": {
      "Description": "MongoDB version",
      "Type": "String",
      "Default": "3.0",
      "AllowedValues": [
        "3.0",
        "2.6"
      ]
    },
    "ShardsPerNode": {
      "Description": "Number of Micro Shards Per Node",
      "Type": "String",
      "Default": "0",
      "AllowedValues": [
	"0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "BuildBucket": {
      "Description": "Main Bucket where the templates/scripts are installed. Do not change.",
      "Type": "String",
      "Default": "quickstart-reference/mongodb/latest"
    },
    "PublicSubnet": {
      "Description": "CIDR Block for the Public DMZ Subnet located in the new VPC.",
      "Type": "String",
      "Default": "10.0.1.0/24",
      "AllowedPattern": "[a-zA-Z0-9]+\\..+"
    },
    "PrimaryReplicaSubnet": {
      "Description": "Private Subnet where Primary Replica Set will be deployed.",
      "Type": "String",
      "Default": "10.0.2.0/24",
      "AllowedPattern": "[a-zA-Z0-9]+\\..+"
    },
    "SecondaryReplicaSubnet0": {
      "Description": "Private Subnet of Secondary Replica Set 0 (Applicable only when ClusterReplicaSetCount >= 2) ",
      "Type": "String",
      "Default": "10.0.3.0/24",
      "AllowedPattern": "[a-zA-Z0-9]+\\..+"
    },
    "SecondaryReplicaSubnet1": {
      "Description": "Private Subnet of Secondary Replica Set 1 (Applicable only when ClusterReplicaSetCount == 3) ",
      "Type": "String",
      "Default": "10.0.4.0/24",
      "AllowedPattern": "[a-zA-Z0-9]+\\..+"
    },
    "KeyName": {
      "Type": "AWS::EC2::KeyPair::KeyName",
      "Default": "home",
      "Description": "Name of an existing EC2 KeyPair. MondoDB instances will launch with this KeyPair."
    },
    "NATInstanceType": {
      "Description": "Amazon EC2 instance type for the NAT Instances.",
      "Type": "String",
      "Default": "t2.small",
      "AllowedValues": [
        "t2.small",
        "t2.medium"
      ]
    },
    "VolumeSize": {
      "Type": "String",
      "Description": "EBS Volume Size (data) to be attached to node in GBs",
      "Default": "400"
    },
    "VolumeType": {
      "Type": "String",
      "Description": "EBS Volume Type (data) to be attached to node in GBs [io1,gp2]",
      "Default": "gp2",
      "AllowedValues": [
        "gp2",
        "io1"
      ]
    },
    "Iops": {
      "Type": "String",
      "Description": "Iops of EBS volume when io1 type is chosen. Otherwise ignored",
      "Default": "100"
    },
    "ConfigServerInstanceType": {
      "Description": "Amazon EC2 instance type for the Config Server",
      "Type": "String",
      "Default": "t2.micro",
      "AllowedValues": [
        "t2.micro",
        "m3.medium",
        "m3.large",
        "m3.xlarge",
        "m3.2xlarge",
        "c3.large",
        "c3.xlarge",
        "c3.2xlarge",
        "c3.4xlarge",
        "c3.8xlarge",
        "r3.large",
        "r3.xlarge",
        "r3.2xlarge",
        "r3.4xlarge",
        "r3.8xlarge",
        "i2.xlarge",
        "i2.2xlarge",
        "i2.4xlarge",
        "i2.8xlarge"
      ]
    },
    "NodeInstanceType": {
      "Description": "Amazon EC2 instance type for the MongoDB nodes.",
      "Type": "String",
      "Default": "m3.medium",
      "AllowedValues": [
        "m3.medium",
        "m3.large",
        "m3.xlarge",
        "m3.2xlarge",
        "c3.large",
        "c3.xlarge",
        "c3.2xlarge",
        "c3.4xlarge",
        "c3.8xlarge",
        "r3.large",
        "r3.xlarge",
        "r3.2xlarge",
        "r3.4xlarge",
        "r3.8xlarge",
        "i2.xlarge",
        "i2.2xlarge",
        "i2.4xlarge",
        "i2.8xlarge"
      ]
    }
  },
  "Conditions": {
    "UsePIops": {
      "Fn::Equals": [
        {
          "Ref": "VolumeType"
        },
        "io1"
      ]
    },
    "UseGP2": {
      "Fn::Equals": [
        {
          "Ref": "VolumeType"
        },
        "gp2"
      ]
    },
    "CreateSingleReplicaSet": {
      "Fn::Equals": [
        {
          "Ref": "ClusterReplicaSetCount"
        },
        "1"
      ]
    },
    "CreateThreeReplicaSet": {
      "Fn::Equals": [
        {
          "Ref": "ClusterReplicaSetCount"
        },
        "3"
      ]
    },
    "CreateNoShard": {
      "Fn::Equals": [
        {
          "Ref": "ClusterShardCount"
        },
        "0"
      ]
    },
    "CreateConfigServers": {
      "Fn::Not": [
        {
          "Fn::Equals": [
            {
              "Ref": "ClusterShardCount"
            },
            "0"
          ]
        }
      ]
    },
    "CreateMinOneShard": {
      "Fn::Not": [
        {
          "Fn::Equals": [
            {
              "Ref": "ClusterShardCount"
            },
            "0"
          ]
        }
      ]
    },
    "CreateMinTwoShards": {
      "Fn::Or": [
        {
          "Fn::Equals": [
            "2",
            {
              "Ref": "ClusterShardCount"
            }
          ]
        },
        {
          "Fn::Equals": [
            "3",
            {
              "Ref": "ClusterShardCount"
            }
          ]
        }
      ]
    },
    "CreateMinThreeShards": {
      "Fn::Or": [
        {
          "Fn::Equals": [
            "3",
            {
              "Ref": "ClusterShardCount"
            }
          ]
        },
        {
          "Fn::Equals": [
            "3",
            {
              "Ref": "ClusterShardCount"
            }
          ]
        }
      ]
    },
    "UsePIopsAndCreateNoShard": {
      "Fn::And": [
        {
          "Condition": "UsePIops"
        },
        {
          "Condition": "CreateNoShard"
        }
      ]
    },
    "UsePIopsAndCreateMinOneShard": {
      "Fn::And": [
        {
          "Condition": "UsePIops"
        },
        {
          "Condition": "CreateMinOneShard"
        }
      ]
    },
    "UsePIopsAndCreateMinTwoShards": {
      "Fn::And": [
        {
          "Condition": "UsePIops"
        },
        {
          "Condition": "CreateMinTwoShards"
        }
      ]
    },
    "UsePIopsAndCreateMinThreeShards": {
      "Fn::And": [
        {
          "Condition": "UsePIops"
        },
        {
          "Condition": "CreateMinThreeShards"
        }
      ]
    },
    "UseGP2AndCreateMinThreeShards": {
      "Fn::And": [
        {
          "Condition": "UseGP2"
        },
        {
          "Condition": "CreateMinThreeShards"
        }
      ]
    },
    "UsePIopsAndIfSecondaryReplicaNode0": {
      "Fn::And": [
        {
          "Condition": "UsePIops"
        },
        {
          "Condition": "IfSecondaryReplicaNode0"
        }
      ]
    },
    "UsePIopsAndIfSecondaryReplicaNode1": {
      "Fn::And": [
        {
          "Condition": "UsePIops"
        },
        {
          "Condition": "IfSecondaryReplicaNode1"
        }
      ]
    },
    "UsePIopsAndIfSecondaryReplicaNode00": {
      "Fn::And": [
        {
          "Condition": "UsePIops"
        },
        {
          "Condition": "IfSecondaryReplicaNode00"
        }
      ]
    },
    "UsePIopsAndIfSecondaryReplicaNode10": {
      "Fn::And": [
        {
          "Condition": "UsePIops"
        },
        {
          "Condition": "IfSecondaryReplicaNode10"
        }
      ]
    },
    "UsePIopsAndIfSecondaryReplicaNode11": {
      "Fn::And": [
        {
          "Condition": "UsePIops"
        },
        {
          "Condition": "IfSecondaryReplicaNode11"
        }
      ]
    },
    "UsePIopsAndIfSecondaryReplicaNode01": {
      "Fn::And": [
        {
          "Condition": "UsePIops"
        },
        {
          "Condition": "IfSecondaryReplicaNode01"
        }
      ]
    },
    "UsePIopsAndIfSecondaryReplicaNode21": {
      "Fn::And": [
        {
          "Condition": "UsePIops"
        },
        {
          "Condition": "IfSecondaryReplicaNode21"
        }
      ]
    },
    "UsePIopsAndIfSecondaryReplicaNode20": {
      "Fn::And": [
        {
          "Condition": "UsePIops"
        },
        {
          "Condition": "IfSecondaryReplicaNode20"
        }
      ]
    },
    "UseGP2AndIfSecondaryReplicaNode10": {
      "Fn::And": [
        {
          "Condition": "UseGP2"
        },
        {
          "Condition": "IfSecondaryReplicaNode10"
        }
      ]
    },
    "UseGP2AndIfSecondaryReplicaNode11": {
      "Fn::And": [
        {
          "Condition": "UseGP2"
        },
        {
          "Condition": "IfSecondaryReplicaNode11"
        }
      ]
    },
    "UseGP2AndIfSecondaryReplicaNode20": {
      "Fn::And": [
        {
          "Condition": "UseGP2"
        },
        {
          "Condition": "IfSecondaryReplicaNode20"
        }
      ]
    },
    "UseGP2AndIfSecondaryReplicaNode21": {
      "Fn::And": [
        {
          "Condition": "UseGP2"
        },
        {
          "Condition": "IfSecondaryReplicaNode21"
        }
      ]
    },
    "UseGP2AndCreateNoShard": {
      "Fn::And": [
        {
          "Condition": "UseGP2"
        },
        {
          "Condition": "CreateNoShard"
        }
      ]
    },
    "UseGP2AndCreateMinOneShard": {
      "Fn::And": [
        {
          "Condition": "UseGP2"
        },
        {
          "Condition": "CreateMinOneShard"
        }
      ]
    },
    "UseGP2AndIfSecondaryReplicaNode0": {
      "Fn::And": [
        {
          "Condition": "UseGP2"
        },
        {
          "Condition": "IfSecondaryReplicaNode0"
        }
      ]
    },
    "UseGP2AndIfSecondaryReplicaNode1": {
      "Fn::And": [
        {
          "Condition": "UseGP2"
        },
        {
          "Condition": "IfSecondaryReplicaNode1"
        }
      ]
    },
    "UseGP2AndIfSecondaryReplicaNode00": {
      "Fn::And": [
        {
          "Condition": "UseGP2"
        },
        {
          "Condition": "IfSecondaryReplicaNode00"
        }
      ]
    },
    "UseGP2AndIfSecondaryReplicaNode01": {
      "Fn::And": [
        {
          "Condition": "UseGP2"
        },
        {
          "Condition": "IfSecondaryReplicaNode01"
        }
      ]
    },
    "UseGP2AndCreateMinTwoShards": {
      "Fn::And": [
        {
          "Condition": "UseGP2"
        },
        {
          "Condition": "CreateMinTwoShards"
        }
      ]
    },
    "IfSecondaryReplicaNode00": {
      "Fn::And": [
        {
          "Condition": "CreateMinOneShard"
        },
        {
          "Condition": "CreateThreeReplicaSet"
        }
      ]
    },
    "IfSecondaryReplicaNode0": {
      "Fn::And": [
        {
          "Condition": "CreateNoShard"
        },
        {
          "Condition": "CreateThreeReplicaSet"
        }
      ]
    },
    "IfSecondaryReplicaNode1": {
      "Fn::And": [
        {
          "Condition": "CreateNoShard"
        },
        {
          "Condition": "CreateThreeReplicaSet"
        }
      ]
    },
    "IfSecondaryReplicaNode01": {
      "Fn::And": [
        {
          "Condition": "CreateMinOneShard"
        },
        {
          "Condition": "CreateThreeReplicaSet"
        }
      ]
    },
    "IfSecondaryReplicaNode10": {
      "Fn::And": [
        {
          "Condition": "CreateMinTwoShards"
        },
        {
          "Condition": "CreateThreeReplicaSet"
        }
      ]
    },
    "IfSecondaryReplicaNode11": {
      "Fn::And": [
        {
          "Condition": "CreateMinTwoShards"
        },
        {
          "Condition": "CreateThreeReplicaSet"
        }
      ]
    },
    "IfSecondaryReplicaNode20": {
      "Fn::And": [
        {
          "Condition": "CreateMinThreeShards"
        },
        {
          "Condition": "CreateThreeReplicaSet"
        }
      ]
    },
    "IfSecondaryReplicaNode21": {
      "Fn::And": [
        {
          "Condition": "CreateMinThreeShards"
        },
        {
          "Condition": "CreateThreeReplicaSet"
        }
      ]
    }
  },
  "Mappings": {
    "InstanceTypeArchFromNode": {
      "m3.medium": {
        "Arch": "64HVM"
      },
      "m3.large": {
        "Arch": "64HVM"
      },
      "m3.xlarge": {
        "Arch": "64HVM"
      },
      "m3.2xlarge": {
        "Arch": "64HVM"
      },
      "c3.large": {
        "Arch": "64HVM"
      },
      "c3.xlarge": {
        "Arch": "64HVM"
      },
      "c3.2xlarge": {
        "Arch": "64HVM"
      },
      "c3.4xlarge": {
        "Arch": "64HVM"
      },
      "c3.8xlarge": {
        "Arch": "64HVM"
      },
      "r3.large": {
        "Arch": "64HVM"
      },
      "r3.xlarge": {
        "Arch": "64HVM"
      },
      "r3.2xlarge": {
        "Arch": "64HVM"
      },
      "r3.4xlarge": {
        "Arch": "64HVM"
      },
      "r3.8xlarge": {
        "Arch": "64HVM"
      },
      "i2.xlarge": {
        "Arch": "64HVM"
      },
      "i2.2xlarge": {
        "Arch": "64HVM"
      },
      "i2.4xlarge": {
        "Arch": "64HVM"
      },
      "i2.8xlarge": {
        "Arch": "64HVM"
      }
    },
         "AWSNATAMI": {
            "eu-central-1": {
                "AMI": "ami-46073a5b"
            },
            "sa-east-1": {
                "AMI": "ami-fbfa41e6"
            },
            "ap-northeast-1": {
                "AMI": "ami-03cf3903"
            },
            "eu-west-1": {
                "AMI": "ami-6975eb1e"
            },
            "us-east-1": {
                "AMI": "ami-303b1458"
            },
            "us-west-1": {
                "AMI": "ami-7da94839"
            },
            "us-west-2": {
                "AMI": "ami-69ae8259"
            },
            "ap-southeast-2": {
                "AMI": "ami-e7ee9edd"
            },
            "ap-southeast-1": {
                "AMI": "ami-b49dace6"
            }
        },



    "InstanceTypeArch": {
      "t2.micro": {
        "Arch": "64HVM"
      },
      "m3.medium": {
        "Arch": "64HVM"
      },
      "m3.large": {
        "Arch": "64HVM"
      },
      "m3.xlarge": {
        "Arch": "64HVM"
      },
      "m3.2xlarge": {
        "Arch": "64HVM"
      },
      "c3.large": {
        "Arch": "64HVM"
      },
      "c3.xlarge": {
        "Arch": "64HVM"
      },
      "c3.2xlarge": {
        "Arch": "64HVM"
      },
      "c3.4xlarge": {
        "Arch": "64HVM"
      },
      "c3.8xlarge": {
        "Arch": "64HVM"
      },
      "r3.large": {
        "Arch": "64HVM"
      },
      "r3.xlarge": {
        "Arch": "64HVM"
      },
      "r3.2xlarge": {
        "Arch": "64HVM"
      },
      "r3.4xlarge": {
        "Arch": "64HVM"
      },
      "r3.8xlarge": {
        "Arch": "64HVM"
      },
      "i2.xlarge": {
        "Arch": "64HVM"
      },
      "i2.2xlarge": {
        "Arch": "64HVM"
      },
      "i2.4xlarge": {
        "Arch": "64HVM"
      },
      "i2.8xlarge": {
        "Arch": "64HVM"
      }
    },


     "AMI": {
          "eu-central-1": {
              "64HVM": "ami-a8221fb5"
          },
          "sa-east-1": {
              "64HVM": "ami-b52890a8"
          },
          "ap-northeast-1": {
              "64HVM": "ami-cbf90ecb"
          },
          "eu-west-1": {
              "64HVM": "ami-a10897d6"
          },
          "us-east-1": {
              "64HVM": "ami-1ecae776"
          },
          "us-west-1": {
              "64HVM": "ami-d114f295"
          },
          "us-west-2": {
              "64HVM": "ami-e7527ed7"
          },
          "ap-southeast-2": {
              "64HVM": "ami-fd9cecc7"
          },
          "ap-southeast-1": {
              "64HVM": "ami-68d8e93a"
          }
      }


  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": {
          "Ref": "VPCCIDR"
        },
        "EnableDnsHostnames": "true",
        "EnableDnsSupport": "true",
        "Tags": [
          {
            "Key": "Application",
            "Value": "MongoDB on AWS"
          }
        ]
      }
    },
    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway"
    },
    "AttachGateway": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "InternetGatewayId": {
          "Ref": "InternetGateway"
        }
      }
    },
    "DMZSubnet": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Ref": "PublicSubnet"
        },
        "Tags": [
          {
            "Key": "Application",
            "Value": "NAT"
          },
          {
            "Key": "Network",
            "Value": "Public"
          }
        ],
        "AvailabilityZone": {
          "Fn::Select": [
            0,
            {
              "Fn::GetAZs": ""
            }
          ]
        }
      }
    },
    "NATInstance": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "Tags": [
          {
            "Key": "Name",
            "Value": "NAT Instance (Public Subnet)"
          }
        ],
        "InstanceType": {
          "Ref": "NATInstanceType"
        },
        "KeyName": {
          "Ref": "KeyName"
        },
        "NetworkInterfaces": [
          {
            "NetworkInterfaceId": {
              "Ref": "NATInterface"
            },
            "DeviceIndex": "0"
          }
        ],
        "ImageId": {
          "Fn::FindInMap": [
            "AWSNATAMI",
            {
              "Ref": "AWS::Region"
            },
            "AMI"
          ]
        }
      }
    },
    "NATEIP": {
      "Type": "AWS::EC2::EIP",
      "Properties": {
        "Domain": "vpc"
      }
    },
    "NATInterface": {
      "Type": "AWS::EC2::NetworkInterface",
      "Properties": {
        "SubnetId": {
          "Ref": "DMZSubnet"
        },
        "Description": "External interface for the NAT instance",
        "GroupSet": [
          {
            "Ref": "NATSecurityGroup"
          }
        ],
        "SourceDestCheck": "false",
        "Tags": [
          {
            "Key": "Network",
            "Value": "Public"
          }
        ]
      }
    },
    "AssociateInterfaceNAT": {
      "Type": "AWS::EC2::EIPAssociation",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "NATEIP",
            "AllocationId"
          ]
        },
        "NetworkInterfaceId": {
          "Ref": "NATInterface"
        }
      }
    },
    "NATSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Enable internal access to the NAT device",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": "80",
            "ToPort": "80",
            "CidrIp": {
              "Ref": "VPCCIDR"
            }
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "443",
            "ToPort": "443",
            "CidrIp": {
              "Ref": "VPCCIDR"
            }
          },
          {
            "IpProtocol": "icmp",
            "FromPort": "8",
            "ToPort": "-1",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "22",
            "ToPort": "22",
            "CidrIp": {
              "Ref": "RemoteAccessCIDR"
            }
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "tcp",
            "FromPort": "80",
            "ToPort": "80",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "443",
            "ToPort": "443",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "22",
            "ToPort": "22",
            "CidrIp": {
              "Ref": "PrimaryReplicaSubnet"
            }
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "22",
            "ToPort": "22",
            "CidrIp": {
              "Ref": "SecondaryReplicaSubnet0"
            }
          },
          {
            "IpProtocol": "icmp",
            "FromPort": "8",
            "ToPort": "-1",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "22",
            "ToPort": "22",
            "CidrIp": {
              "Ref": "SecondaryReplicaSubnet1"
            }
          }
        ]
      }
    },
    "DMZRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Application",
            "Value": "NAT"
          }
        ]
      }
    },
    "PublicRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "DMZRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": {
          "Ref": "InternetGateway"
        }
      }
    },
    "PublicNetworkAcl": {
      "Type": "AWS::EC2::NetworkAcl",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Network",
            "Value": "Public"
          }
        ]
      }
    },
    "PublicSubnetRouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "DMZSubnet"
        },
        "RouteTableId": {
          "Ref": "DMZRouteTable"
        }
      }
    },
    "InboundPublicNetworkAclEntry": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {
          "Ref": "PublicNetworkAcl"
        },
        "RuleNumber": "100",
        "Protocol": "6",
        "RuleAction": "allow",
        "Egress": "false",
        "CidrBlock": "0.0.0.0/0",
        "PortRange": {
          "From": "0",
          "To": "65535"
        }
      }
    },
    "OutBoundPublicNetworkAclEntry": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {
          "Ref": "PublicNetworkAcl"
        },
        "RuleNumber": "100",
        "Protocol": "6",
        "RuleAction": "allow",
        "Egress": "true",
        "CidrBlock": "0.0.0.0/0",
        "PortRange": {
          "From": "0",
          "To": "65535"
        }
      }
    },
    "PrimaryNodeSubnet": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Ref": "PrimaryReplicaSubnet"
        },
        "Tags": [
          {
            "Key": "Application",
            "Value": "MongoDB"
          },
          {
            "Key": "Network",
            "Value": "Private"
          }
        ],
        "AvailabilityZone": {
          "Fn::Select": [
            "0",
            {
              "Fn::GetAZs": ""
            }
          ]
        }
      },
      "DependsOn": "VPC"
    },
    "PrimaryNodeRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Application",
            "Value": "MongoDB"
          }
        ]
      },
      "DependsOn": "VPC"
    },
    "PrimaryNodeRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrimaryNodeRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "InstanceId": {
          "Ref": "NATInstance"
        }
      },
      "DependsOn": "VPC"
    },
    "PrimaryPublicNetworkAcl": {
      "Type": "AWS::EC2::NetworkAcl",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Network",
            "Value": "Public"
          }
        ]
      },
      "DependsOn": "VPC"
    },
    "PrimaryNodeSubnetRouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrimaryNodeSubnet"
        },
        "RouteTableId": {
          "Ref": "PrimaryNodeRouteTable"
        }
      },
      "DependsOn": "VPC"
    },
    "PrimaryInboundPublicNetworkAclEntry": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {
          "Ref": "PublicNetworkAcl"
        },
        "RuleNumber": "89",
        "Protocol": "6",
        "RuleAction": "allow",
        "Egress": "false",
        "CidrBlock": "0.0.0.0/0",
        "PortRange": {
          "From": "0",
          "To": "65535"
        }
      },
      "DependsOn": "VPC"
    },
    "PrimaryOutBoundPublicNetworkAclEntry": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {
          "Ref": "PublicNetworkAcl"
        },
        "RuleNumber": "88",
        "Protocol": "6",
        "RuleAction": "allow",
        "Egress": "true",
        "CidrBlock": "0.0.0.0/0",
        "PortRange": {
          "From": "0",
          "To": "65535"
        }
      },
      "DependsOn": "VPC"
    },
    "Secondary0NodeSubnet": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Ref": "SecondaryReplicaSubnet0"
        },
        "Tags": [
          {
            "Key": "Application",
            "Value": "MongoDB"
          },
          {
            "Key": "Network",
            "Value": "Private"
          }
        ],
        "AvailabilityZone": {
          "Fn::Select": [
            "1",
            {
              "Fn::GetAZs": ""
            }
          ]
        }
      },
      "Condition": "CreateThreeReplicaSet",
      "DependsOn": "VPC"
    },
    "Secondary0NodeRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Application",
            "Value": "MongoDB"
          }
        ]
      },
      "Condition": "CreateThreeReplicaSet",
      "DependsOn": "VPC"
    },
    "Secondary0NodeRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "Secondary0NodeRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "InstanceId": {
          "Ref": "NATInstance"
        }
      },
      "Condition": "CreateThreeReplicaSet",
      "DependsOn": "VPC"
    },
    "Secondary0PublicNetworkAcl": {
      "Type": "AWS::EC2::NetworkAcl",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Network",
            "Value": "Public"
          }
        ]
      },
      "Condition": "CreateThreeReplicaSet",
      "DependsOn": "VPC"
    },
    "Secondary0NodeSubnetRouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "Secondary0NodeSubnet"
        },
        "RouteTableId": {
          "Ref": "Secondary0NodeRouteTable"
        }
      },
      "Condition": "CreateThreeReplicaSet",
      "DependsOn": "VPC"
    },
    "Secondary0InboundPublicNetworkAclEntry": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {
          "Ref": "PublicNetworkAcl"
        },
        "RuleNumber": "91",
        "Protocol": "6",
        "RuleAction": "allow",
        "Egress": "false",
        "CidrBlock": "0.0.0.0/0",
        "PortRange": {
          "From": "0",
          "To": "65535"
        }
      },
      "Condition": "CreateThreeReplicaSet",
      "DependsOn": "VPC"
    },
    "Secondary0OutBoundPublicNetworkAclEntry": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {
          "Ref": "PublicNetworkAcl"
        },
        "RuleNumber": "90",
        "Protocol": "6",
        "RuleAction": "allow",
        "Egress": "true",
        "CidrBlock": "0.0.0.0/0",
        "PortRange": {
          "From": "0",
          "To": "65535"
        }
      },
      "Condition": "CreateThreeReplicaSet",
      "DependsOn": "VPC"
    },
    "Secondary1NodeSubnet": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Ref": "SecondaryReplicaSubnet1"
        },
        "Tags": [
          {
            "Key": "Application",
            "Value": "MongoDB"
          },
          {
            "Key": "Network",
            "Value": "Private"
          }
        ],
        "AvailabilityZone": {
          "Fn::Select": [
            "2",
            {
              "Fn::GetAZs": ""
            }
          ]
        }
      },
      "Condition": "CreateThreeReplicaSet",
      "DependsOn": "VPC"
    },
    "Secondary1NodeRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Application",
            "Value": "MongoDB"
          }
        ]
      },
      "Condition": "CreateThreeReplicaSet",
      "DependsOn": "VPC"
    },
    "Secondary1NodeRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "Secondary1NodeRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "InstanceId": {
          "Ref": "NATInstance"
        }
      },
      "Condition": "CreateThreeReplicaSet",
      "DependsOn": "VPC"
    },
    "Secondary1PublicNetworkAcl": {
      "Type": "AWS::EC2::NetworkAcl",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Network",
            "Value": "Public"
          }
        ]
      },
      "Condition": "CreateThreeReplicaSet",
      "DependsOn": "VPC"
    },
    "Secondary1NodeSubnetRouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "Secondary1NodeSubnet"
        },
        "RouteTableId": {
          "Ref": "Secondary1NodeRouteTable"
        }
      },
      "Condition": "CreateThreeReplicaSet",
      "DependsOn": "VPC"
    },
    "Secondary1InboundPublicNetworkAclEntry": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {
          "Ref": "PublicNetworkAcl"
        },
        "RuleNumber": "93",
        "Protocol": "6",
        "RuleAction": "allow",
        "Egress": "false",
        "CidrBlock": "0.0.0.0/0",
        "PortRange": {
          "From": "0",
          "To": "65535"
        }
      },
      "Condition": "CreateThreeReplicaSet",
      "DependsOn": "VPC"
    },
    "Secondary1OutBoundPublicNetworkAclEntry": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {
          "Ref": "PublicNetworkAcl"
        },
        "RuleNumber": "92",
        "Protocol": "6",
        "RuleAction": "allow",
        "Egress": "true",
        "CidrBlock": "0.0.0.0/0",
        "PortRange": {
          "From": "0",
          "To": "65535"
        }
      },
      "Condition": "CreateThreeReplicaSet",
      "DependsOn": "VPC"
    },
    "PrimaryReplicaNode0NodeInterface": {
      "Type": "AWS::EC2::NetworkInterface",
      "Properties": {
        "Description": "Network Interface for Mongo Node",
        "SubnetId": {
          "Ref": "PrimaryNodeSubnet"
        },
        "GroupSet": [
          {
            "Ref": "PrimaryReplicaNode0NodeSecurityGroup"
          }
        ],
        "SourceDestCheck": "true",
        "Tags": [
          {
            "Key": "Network",
            "Value": "Private"
          }
        ]
      },
      "Condition": "CreateNoShard",
      "DependsOn": "PrimaryNodeSubnet"
    },
    "PrimaryReplicaNode0NodeSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Enable external access and allow communication (Trim as needed)",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": "27017",
            "ToPort": "27030",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "28017",
            "ToPort": "28017",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "22",
            "ToPort": "22",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "FromPort": "1",
            "ToPort": "65535"
          }
        ]
      },
      "Condition": "CreateNoShard",
      "DependsOn": "PrimaryNodeSubnet"
    },
    "PrimaryReplicaNode0NodeIAMRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "ec2.amazonaws.com"
                ]
              },
              "Action": [
                "sts:AssumeRole"
              ]
            }
          ]
        },
        "Path": "/",
        "Policies": [
          {
            "PolicyName": "Backup",
            "PolicyDocument": {
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:*",
                    "ec2:Describe*",
                    "ec2:AttachNetworkInterface",
                    "ec2:AttachVolume",
                    "ec2:CreateTags",
                    "ec2:CreateVolume",
                    "ec2:RunInstances",
                    "ec2:StartInstances",
                    "ec2:DeleteVolume",
                    "ec2:CreateSecurityGroup",
                    "ec2:CreateSnapshot"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:*",
                    "dynamodb:Scan",
                    "dynamodb:Query",
                    "dynamodb:GetItem",
                    "dynamodb:BatchGetItem",
                    "dynamodb:UpdateTable"
                  ],
                  "Resource": [
                    "*"
                  ]
                }
              ]
            }
          }
        ]
      },
      "Condition": "CreateNoShard",
      "DependsOn": "PrimaryNodeSubnet"
    },
    "PrimaryReplicaNode0NodeIAMProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Path": "/",
        "Roles": [
          {
            "Ref": "PrimaryReplicaNode0NodeIAMRole"
          }
        ]
      },
      "Condition": "CreateNoShard",
      "DependsOn": "PrimaryNodeSubnet"
    },
    "PrimaryReplicaNode0WaitForNodeInstallIO1": {
      "Type": "AWS::CloudFormation::WaitCondition",
      "DependsOn": "PrimaryNodeSubnet",
      "Condition": "UsePIopsAndCreateNoShard",
      "Properties": {
        "Handle": {
          "Ref": "PrimaryReplicaNode0WaitForNodeInstallWaitHandle"
        },
        "Timeout": "3600"
      }
    },
    "PrimaryReplicaNode0WaitForNodeInstallGP2": {
      "Type": "AWS::CloudFormation::WaitCondition",
      "DependsOn": "PrimaryNodeSubnet",
      "Condition": "UseGP2AndCreateNoShard",
      "Properties": {
        "Handle": {
          "Ref": "PrimaryReplicaNode0WaitForNodeInstallWaitHandle"
        },
        "Timeout": "3600"
      }
    },
    "PrimaryReplicaNode0WaitForNodeInstallWaitHandle": {
      "Type": "AWS::CloudFormation::WaitConditionHandle",
      "Properties": {},
      "Condition": "CreateNoShard",
      "DependsOn": "PrimaryNodeSubnet"
    },
    "PrimaryReplicaNode0NodeInstanceGP2": {
      "Type": "AWS::EC2::Instance",
      "Condition": "UseGP2AndCreateNoShard",
      "Metadata": {
        "HostRole": "MongoDB Node"
      },
      "Properties": {
        "NetworkInterfaces": [
          {
            "NetworkInterfaceId": {
              "Ref": "PrimaryReplicaNode0NodeInterface"
            },
            "DeviceIndex": "0"
          }
        ],
        "KeyName": {
          "Ref": "KeyName"
        },
        "ImageId": {
          "Fn::FindInMap": [
            "AMI",
            {
              "Ref": "AWS::Region"
            },
            {
              "Fn::FindInMap": [
                "InstanceTypeArch",
                {
                  "Ref": "NodeInstanceType"
                },
                "Arch"
              ]
            }
          ]
        },
        "IamInstanceProfile": {
          "Ref": "PrimaryReplicaNode0NodeIAMProfile"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "PrimaryReplicaNode0"
          },
          {
            "Key": "ClusterReplicaSetCount",
            "Value": {
              "Ref": "ClusterReplicaSetCount"
            }
          },
          {
            "Key": "NodeReplicaSetIndex",
            "Value": "0"
          },
          {
            "Key": "ClusterShardCount",
            "Value": {
              "Ref": "ClusterShardCount"
            }
          },
          {
            "Key": "ShardsPerNode",
            "Value": {
              "Ref": "ShardsPerNode"
            }
          },
          {
            "Key": "NodeShardIndex",
            "Value": "-1"
          }
        ],
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvdg",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "250"
            }
          },
          {
            "DeviceName": "/dev/xvdh",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "200"
            }
          },
          {
            "DeviceName": "/dev/xvdf",
            "Ebs": {
              "VolumeSize": {
                "Ref": "VolumeSize"
              },
              "VolumeType": "gp2",
              "DeleteOnTermination": "true"
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -v\n",
                "mkdir -p /home/ec2-user/mongodb \n",
                "cd /home/ec2-user/mongodb \n",
                "# Wait until the NAT initializes and Internet is available \n",
                "until ping -c 1 ietf.org \n",
                "do \n",
                "sleep 5; \n",
                "done \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/orchestrator.sh orchestrator.sh\n",
                "chmod +x orchestrator.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/init.sh init.sh\n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/signalFinalStatus.sh signalFinalStatus.sh\n",
                "chmod +x signalFinalStatus.sh \n",
                "chmod +x init.sh \n",
                "#  Run the install \n",
                "#  Store stack name to tag DDB name\n",
                "echo ",
                {
                  "Fn::Join": [
                    "_",
                    [
                      "export TABLE_NAMETAG=",
                      {
                        "Ref": "AWS::StackName"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export MongoDBVersion=",
                      {
                        "Ref": "MongoDBVersion"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export VPC=",
                      {
                        "Ref": "VPC"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "#  Store WaitHandler\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "\"",
                      "export WAITHANDLER='",
                      {
                        "Ref": "PrimaryReplicaNode0WaitForNodeInstallWaitHandle"
                      },
                      "'",
                      "\""
                    ]
                  ]
                },
                " >> config.sh\n",
                "./init.sh > install.log 2>&1 \n",
                "#  Cleanup \n",
                "#rm -rf *\n",
                "chown -R ec2-user:ec2-user /home/ec2-user/ \n",
                "/home/ec2-user/mongodb/signalFinalStatus.sh 0\n"
              ]
            ]
          }
        },
        "InstanceType": {
          "Ref": "NodeInstanceType"
        }
      },
      "DependsOn": "PrimaryNodeSubnet"
    },
    "PrimaryReplicaNode0NodeInstanceIO1": {
      "Type": "AWS::EC2::Instance",
      "Condition": "UsePIopsAndCreateNoShard",
      "Metadata": {
        "HostRole": "MongoDB Node"
      },
      "Properties": {
        "NetworkInterfaces": [
          {
            "NetworkInterfaceId": {
              "Ref": "PrimaryReplicaNode0NodeInterface"
            },
            "DeviceIndex": "0"
          }
        ],
        "KeyName": {
          "Ref": "KeyName"
        },
        "ImageId": {
          "Fn::FindInMap": [
            "AMI",
            {
              "Ref": "AWS::Region"
            },
            {
              "Fn::FindInMap": [
                "InstanceTypeArch",
                {
                  "Ref": "NodeInstanceType"
                },
                "Arch"
              ]
            }
          ]
        },
        "IamInstanceProfile": {
          "Ref": "PrimaryReplicaNode0NodeIAMProfile"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "PrimaryReplicaNode0"
          },
          {
            "Key": "ClusterReplicaSetCount",
            "Value": {
              "Ref": "ClusterReplicaSetCount"
            }
          },
          {
            "Key": "NodeReplicaSetIndex",
            "Value": "0"
          },
          {
            "Key": "ClusterShardCount",
            "Value": {
              "Ref": "ClusterShardCount"
            }
          },
          {
            "Key": "ShardsPerNode",
            "Value": {
              "Ref": "ShardsPerNode"
            }
          },
          {
            "Key": "NodeShardIndex",
            "Value": "-1"
          }
        ],
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvdg",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "250"
            }
          },
          {
            "DeviceName": "/dev/xvdh",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "200"
            }
          },
          {
            "DeviceName": "/dev/xvdf",
            "Ebs": {
              "VolumeSize": {
                "Ref": "VolumeSize"
              },
              "VolumeType": "io1",
              "Iops": {
                "Ref": "Iops"
              },
              "DeleteOnTermination": "true"
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -v\n",
                "mkdir -p /home/ec2-user/mongodb \n",
                "cd /home/ec2-user/mongodb \n",
                "# Wait until the NAT initializes and Internet is available \n",
                "until ping -c 1 ietf.org \n",
                "do \n",
                "sleep 5; \n",
                "done \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/orchestrator.sh orchestrator.sh\n",
                "chmod +x orchestrator.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/init.sh init.sh\n",
                "chmod +x init.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/signalFinalStatus.sh signalFinalStatus.sh\n",
                "chmod +x signalFinalStatus.sh \n",
                "#  Run the install \n",
                "#  Store stack name to tag DDB name\n",
                "echo ",
                {
                  "Fn::Join": [
                    "_",
                    [
                      "export TABLE_NAMETAG=",
                      {
                        "Ref": "AWS::StackName"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export VPC=",
                      {
                        "Ref": "VPC"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export MongoDBVersion=",
                      {
                        "Ref": "MongoDBVersion"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "#  Store WaitHandler\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "\"",
                      "export WAITHANDLER='",
                      {
                        "Ref": "PrimaryReplicaNode0WaitForNodeInstallWaitHandle"
                      },
                      "'",
                      "\""
                    ]
                  ]
                },
                " >> config.sh\n",
                "./init.sh > install.log 2>&1 \n",
                "#  Cleanup \n",
                "#rm -rf *\n",
                "chown -R ec2-user:ec2-user /home/ec2-user/ \n",
                "# All is well so signal success\n",
                "/home/ec2-user/mongodb/signalFinalStatus.sh 0\n"
              ]
            ]
          }
        },
        "InstanceType": {
          "Ref": "NodeInstanceType"
        }
      },
      "DependsOn": "PrimaryNodeSubnet"
    },
    "PrimaryReplicaNode00NodeInterface": {
      "Type": "AWS::EC2::NetworkInterface",
      "Properties": {
        "Description": "Network Interface for Mongo Node",
        "SubnetId": {
          "Ref": "PrimaryNodeSubnet"
        },
        "GroupSet": [
          {
            "Ref": "PrimaryReplicaNode00NodeSecurityGroup"
          }
        ],
        "SourceDestCheck": "true",
        "Tags": [
          {
            "Key": "Network",
            "Value": "Private"
          }
        ]
      },
      "Condition": "CreateMinOneShard"
    },
    "PrimaryReplicaNode00NodeSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Enable external access and allow communication (Trim as needed)",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": "27017",
            "ToPort": "27030",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "28017",
            "ToPort": "28017",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "22",
            "ToPort": "22",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "FromPort": "1",
            "ToPort": "65535"
          }
        ]
      },
      "Condition": "CreateMinOneShard"
    },
    "PrimaryReplicaNode00NodeIAMRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "ec2.amazonaws.com"
                ]
              },
              "Action": [
                "sts:AssumeRole"
              ]
            }
          ]
        },
        "Path": "/",
        "Policies": [
          {
            "PolicyName": "Backup",
            "PolicyDocument": {
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:*",
                    "ec2:Describe*",
                    "ec2:AttachNetworkInterface",
                    "ec2:AttachVolume",
                    "ec2:CreateTags",
                    "ec2:CreateVolume",
                    "ec2:RunInstances",
                    "ec2:StartInstances",
                    "ec2:DeleteVolume",
                    "ec2:CreateSecurityGroup",
                    "ec2:CreateSnapshot"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:*",
                    "dynamodb:Scan",
                    "dynamodb:Query",
                    "dynamodb:GetItem",
                    "dynamodb:BatchGetItem",
                    "dynamodb:UpdateTable"
                  ],
                  "Resource": [
                    "*"
                  ]
                }
              ]
            }
          }
        ]
      },
      "Condition": "CreateMinOneShard"
    },
    "PrimaryReplicaNode00NodeIAMProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Path": "/",
        "Roles": [
          {
            "Ref": "PrimaryReplicaNode00NodeIAMRole"
          }
        ]
      },
      "Condition": "CreateMinOneShard"
    },
    "PrimaryReplicaNode00WaitForNodeInstallIO1": {
      "Type": "AWS::CloudFormation::WaitCondition",
      "DependsOn": "PrimaryReplicaNode00NodeInstanceIO1",
      "Condition": "UsePIopsAndCreateMinOneShard",
      "Properties": {
        "Handle": {
          "Ref": "PrimaryReplicaNode00WaitForNodeInstallWaitHandle"
        },
        "Timeout": "3600"
      }
    },
    "PrimaryReplicaNode00WaitForNodeInstallGP2": {
      "Type": "AWS::CloudFormation::WaitCondition",
      "DependsOn": "PrimaryReplicaNode00NodeInstanceGP2",
      "Condition": "UseGP2AndCreateMinOneShard",
      "Properties": {
        "Handle": {
          "Ref": "PrimaryReplicaNode00WaitForNodeInstallWaitHandle"
        },
        "Timeout": "3600"
      }
    },
    "PrimaryReplicaNode00WaitForNodeInstallWaitHandle": {
      "Type": "AWS::CloudFormation::WaitConditionHandle",
      "Properties": {},
      "Condition": "CreateMinOneShard"
    },
    "PrimaryReplicaNode00NodeInstanceGP2": {
      "Type": "AWS::EC2::Instance",
      "Condition": "UseGP2AndCreateMinOneShard",
      "Metadata": {
        "HostRole": "MongoDB Node"
      },
      "Properties": {
        "NetworkInterfaces": [
          {
            "NetworkInterfaceId": {
              "Ref": "PrimaryReplicaNode00NodeInterface"
            },
            "DeviceIndex": "0"
          }
        ],
        "KeyName": {
          "Ref": "KeyName"
        },
        "ImageId": {
          "Fn::FindInMap": [
            "AMI",
            {
              "Ref": "AWS::Region"
            },
            {
              "Fn::FindInMap": [
                "InstanceTypeArch",
                {
                  "Ref": "NodeInstanceType"
                },
                "Arch"
              ]
            }
          ]
        },
        "IamInstanceProfile": {
          "Ref": "PrimaryReplicaNode00NodeIAMProfile"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "PrimaryReplicaNode00"
          },
          {
            "Key": "ClusterReplicaSetCount",
            "Value": {
              "Ref": "ClusterReplicaSetCount"
            }
          },
          {
            "Key": "NodeReplicaSetIndex",
            "Value": "0"
          },
          {
            "Key": "ClusterShardCount",
            "Value": {
              "Ref": "ClusterShardCount"
            }
          },
          {
            "Key": "ShardsPerNode",
            "Value": {
              "Ref": "ShardsPerNode"
            }
          },
          {
            "Key": "NodeShardIndex",
            "Value": "0"
          }
        ],
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvdg",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "250"
            }
          },
          {
            "DeviceName": "/dev/xvdh",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "200"
            }
          },
          {
            "DeviceName": "/dev/xvdf",
            "Ebs": {
              "VolumeSize": {
                "Ref": "VolumeSize"
              },
              "VolumeType": "gp2",
              "DeleteOnTermination": "true"
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -v\n",
                "mkdir -p /home/ec2-user/mongodb \n",
                "cd /home/ec2-user/mongodb \n",
                "# Wait until the NAT initializes and Internet is available \n",
                "until ping -c 1 ietf.org \n",
                "do \n",
                "sleep 5; \n",
                "done \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/orchestrator.sh orchestrator.sh\n",
                "chmod +x orchestrator.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/init.sh init.sh\n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/signalFinalStatus.sh signalFinalStatus.sh\n",
                "chmod +x signalFinalStatus.sh \n",
                "chmod +x init.sh \n",
                "#  Run the install \n",
                "#  Store stack name to tag DDB name\n",
                "echo ",
                {
                  "Fn::Join": [
                    "_",
                    [
                      "export TABLE_NAMETAG=",
                      {
                        "Ref": "AWS::StackName"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export MongoDBVersion=",
                      {
                        "Ref": "MongoDBVersion"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export VPC=",
                      {
                        "Ref": "VPC"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "#  Store WaitHandler\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "\"",
                      "export WAITHANDLER='",
                      {
                        "Ref": "PrimaryReplicaNode00WaitForNodeInstallWaitHandle"
                      },
                      "'",
                      "\""
                    ]
                  ]
                },
                " >> config.sh\n",
                "./init.sh > install.log 2>&1 \n",
                "#  Cleanup \n",
                "#rm -rf *\n",
                "chown -R ec2-user:ec2-user /home/ec2-user/ \n",
                "/home/ec2-user/mongodb/signalFinalStatus.sh 0\n"
              ]
            ]
          }
        },
        "InstanceType": {
          "Ref": "NodeInstanceType"
        }
      }
    },
    "PrimaryReplicaNode00NodeInstanceIO1": {
      "Type": "AWS::EC2::Instance",
      "Condition": "UsePIopsAndCreateMinOneShard",
      "Metadata": {
        "HostRole": "MongoDB Node"
      },
      "Properties": {
        "NetworkInterfaces": [
          {
            "NetworkInterfaceId": {
              "Ref": "PrimaryReplicaNode00NodeInterface"
            },
            "DeviceIndex": "0"
          }
        ],
        "KeyName": {
          "Ref": "KeyName"
        },
        "ImageId": {
          "Fn::FindInMap": [
            "AMI",
            {
              "Ref": "AWS::Region"
            },
            {
              "Fn::FindInMap": [
                "InstanceTypeArch",
                {
                  "Ref": "NodeInstanceType"
                },
                "Arch"
              ]
            }
          ]
        },
        "IamInstanceProfile": {
          "Ref": "PrimaryReplicaNode00NodeIAMProfile"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "PrimaryReplicaNode00"
          },
          {
            "Key": "ClusterReplicaSetCount",
            "Value": {
              "Ref": "ClusterReplicaSetCount"
            }
          },
          {
            "Key": "NodeReplicaSetIndex",
            "Value": "0"
          },
          {
            "Key": "ClusterShardCount",
            "Value": {
              "Ref": "ClusterShardCount"
            }
          },
          {
            "Key": "ShardsPerNode",
            "Value": {
              "Ref": "ShardsPerNode"
            }
          },
          {
            "Key": "NodeShardIndex",
            "Value": "0"
          }
        ],
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvdg",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "250"
            }
          },
          {
            "DeviceName": "/dev/xvdh",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "200"
            }
          },
          {
            "DeviceName": "/dev/xvdf",
            "Ebs": {
              "VolumeSize": {
                "Ref": "VolumeSize"
              },
              "VolumeType": "io1",
              "Iops": {
                "Ref": "Iops"
              },
              "DeleteOnTermination": "true"
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -v\n",
                "mkdir -p /home/ec2-user/mongodb \n",
                "cd /home/ec2-user/mongodb \n",
                "# Wait until the NAT initializes and Internet is available \n",
                "until ping -c 1 ietf.org \n",
                "do \n",
                "sleep 5; \n",
                "done \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/orchestrator.sh orchestrator.sh\n",
                "chmod +x orchestrator.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/init.sh init.sh\n",
                "chmod +x init.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/signalFinalStatus.sh signalFinalStatus.sh\n",
                "chmod +x signalFinalStatus.sh \n",
                "#  Run the install \n",
                "#  Store stack name to tag DDB name\n",
                "echo ",
                {
                  "Fn::Join": [
                    "_",
                    [
                      "export TABLE_NAMETAG=",
                      {
                        "Ref": "AWS::StackName"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export VPC=",
                      {
                        "Ref": "VPC"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export MongoDBVersion=",
                      {
                        "Ref": "MongoDBVersion"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "#  Store WaitHandler\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "\"",
                      "export WAITHANDLER='",
                      {
                        "Ref": "PrimaryReplicaNode00WaitForNodeInstallWaitHandle"
                      },
                      "'",
                      "\""
                    ]
                  ]
                },
                " >> config.sh\n",
                "./init.sh > install.log 2>&1 \n",
                "#  Cleanup \n",
                "#rm -rf *\n",
                "chown -R ec2-user:ec2-user /home/ec2-user/ \n",
                "# All is well so signal success\n",
                "/home/ec2-user/mongodb/signalFinalStatus.sh 0\n"
              ]
            ]
          }
        },
        "InstanceType": {
          "Ref": "NodeInstanceType"
        }
      }
    },
    "SecondaryReplicaNode0NodeInterface": {
      "Type": "AWS::EC2::NetworkInterface",
      "Properties": {
        "Description": "Network Interface for Mongo Node",
        "SubnetId": {
          "Ref": "Secondary0NodeSubnet"
        },
        "GroupSet": [
          {
            "Ref": "SecondaryReplicaNode0NodeSecurityGroup"
          }
        ],
        "SourceDestCheck": "true",
        "Tags": [
          {
            "Key": "Network",
            "Value": "Private"
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode0"
    },
    "SecondaryReplicaNode0NodeSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Enable external access and allow communication (Trim as needed)",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": "27017",
            "ToPort": "27030",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "28017",
            "ToPort": "28017",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "22",
            "ToPort": "22",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "FromPort": "1",
            "ToPort": "65535"
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode0"
    },
    "SecondaryReplicaNode0NodeIAMRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "ec2.amazonaws.com"
                ]
              },
              "Action": [
                "sts:AssumeRole"
              ]
            }
          ]
        },
        "Path": "/",
        "Policies": [
          {
            "PolicyName": "Backup",
            "PolicyDocument": {
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:*",
                    "ec2:Describe*",
                    "ec2:AttachNetworkInterface",
                    "ec2:AttachVolume",
                    "ec2:CreateTags",
                    "ec2:CreateVolume",
                    "ec2:RunInstances",
                    "ec2:StartInstances",
                    "ec2:DeleteVolume",
                    "ec2:CreateSecurityGroup",
                    "ec2:CreateSnapshot"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:*",
                    "dynamodb:Scan",
                    "dynamodb:Query",
                    "dynamodb:GetItem",
                    "dynamodb:BatchGetItem",
                    "dynamodb:UpdateTable"
                  ],
                  "Resource": [
                    "*"
                  ]
                }
              ]
            }
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode0"
    },
    "SecondaryReplicaNode0NodeIAMProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Path": "/",
        "Roles": [
          {
            "Ref": "SecondaryReplicaNode0NodeIAMRole"
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode0"
    },
    "SecondaryReplicaNode0WaitForNodeInstallIO1": {
      "Type": "AWS::CloudFormation::WaitCondition",
      "DependsOn": "SecondaryReplicaNode0NodeInstanceIO1",
      "Condition": "UsePIopsAndIfSecondaryReplicaNode0",
      "Properties": {
        "Handle": {
          "Ref": "SecondaryReplicaNode0WaitForNodeInstallWaitHandle"
        },
        "Timeout": "3600"
      }
    },
    "SecondaryReplicaNode0WaitForNodeInstallGP2": {
      "Type": "AWS::CloudFormation::WaitCondition",
      "DependsOn": "SecondaryReplicaNode0NodeInstanceGP2",
      "Condition": "UseGP2AndIfSecondaryReplicaNode0",
      "Properties": {
        "Handle": {
          "Ref": "SecondaryReplicaNode0WaitForNodeInstallWaitHandle"
        },
        "Timeout": "3600"
      }
    },
    "SecondaryReplicaNode0WaitForNodeInstallWaitHandle": {
      "Type": "AWS::CloudFormation::WaitConditionHandle",
      "Properties": {},
      "Condition": "IfSecondaryReplicaNode0"
    },
    "SecondaryReplicaNode0NodeInstanceGP2": {
      "Type": "AWS::EC2::Instance",
      "Condition": "UseGP2AndIfSecondaryReplicaNode0",
      "Metadata": {
        "HostRole": "MongoDB Node"
      },
      "Properties": {
        "NetworkInterfaces": [
          {
            "NetworkInterfaceId": {
              "Ref": "SecondaryReplicaNode0NodeInterface"
            },
            "DeviceIndex": "0"
          }
        ],
        "KeyName": {
          "Ref": "KeyName"
        },
        "ImageId": {
          "Fn::FindInMap": [
            "AMI",
            {
              "Ref": "AWS::Region"
            },
            {
              "Fn::FindInMap": [
                "InstanceTypeArch",
                {
                  "Ref": "NodeInstanceType"
                },
                "Arch"
              ]
            }
          ]
        },
        "IamInstanceProfile": {
          "Ref": "SecondaryReplicaNode0NodeIAMProfile"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "SecondaryReplicaNode0"
          },
          {
            "Key": "ClusterReplicaSetCount",
            "Value": {
              "Ref": "ClusterReplicaSetCount"
            }
          },
          {
            "Key": "NodeReplicaSetIndex",
            "Value": "1"
          },
          {
            "Key": "ClusterShardCount",
            "Value": {
              "Ref": "ClusterShardCount"
            }
          },
          {
            "Key": "ShardsPerNode",
            "Value": {
              "Ref": "ShardsPerNode"
            }
          },
          {
            "Key": "NodeShardIndex",
            "Value": "-1"
          }
        ],
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvdg",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "250"
            }
          },
          {
            "DeviceName": "/dev/xvdh",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "200"
            }
          },
          {
            "DeviceName": "/dev/xvdf",
            "Ebs": {
              "VolumeSize": {
                "Ref": "VolumeSize"
              },
              "VolumeType": "gp2",
              "DeleteOnTermination": "true"
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -v\n",
                "mkdir -p /home/ec2-user/mongodb \n",
                "cd /home/ec2-user/mongodb \n",
                "# Wait until the NAT initializes and Internet is available \n",
                "until ping -c 1 ietf.org \n",
                "do \n",
                "sleep 5; \n",
                "done \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/orchestrator.sh orchestrator.sh\n",
                "chmod +x orchestrator.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/init.sh init.sh\n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/signalFinalStatus.sh signalFinalStatus.sh\n",
                "chmod +x signalFinalStatus.sh \n",
                "chmod +x init.sh \n",
                "#  Run the install \n",
                "#  Store stack name to tag DDB name\n",
                "echo ",
                {
                  "Fn::Join": [
                    "_",
                    [
                      "export TABLE_NAMETAG=",
                      {
                        "Ref": "AWS::StackName"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export MongoDBVersion=",
                      {
                        "Ref": "MongoDBVersion"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export VPC=",
                      {
                        "Ref": "VPC"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "#  Store WaitHandler\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "\"",
                      "export WAITHANDLER='",
                      {
                        "Ref": "SecondaryReplicaNode0WaitForNodeInstallWaitHandle"
                      },
                      "'",
                      "\""
                    ]
                  ]
                },
                " >> config.sh\n",
                "./init.sh > install.log 2>&1 \n",
                "#  Cleanup \n",
                "#rm -rf *\n",
                "chown -R ec2-user:ec2-user /home/ec2-user/ \n",
                "/home/ec2-user/mongodb/signalFinalStatus.sh 0\n"
              ]
            ]
          }
        },
        "InstanceType": {
          "Ref": "NodeInstanceType"
        }
      }
    },
    "SecondaryReplicaNode0NodeInstanceIO1": {
      "Type": "AWS::EC2::Instance",
      "Condition": "UsePIopsAndIfSecondaryReplicaNode0",
      "Metadata": {
        "HostRole": "MongoDB Node"
      },
      "Properties": {
        "NetworkInterfaces": [
          {
            "NetworkInterfaceId": {
              "Ref": "SecondaryReplicaNode0NodeInterface"
            },
            "DeviceIndex": "0"
          }
        ],
        "KeyName": {
          "Ref": "KeyName"
        },
        "ImageId": {
          "Fn::FindInMap": [
            "AMI",
            {
              "Ref": "AWS::Region"
            },
            {
              "Fn::FindInMap": [
                "InstanceTypeArch",
                {
                  "Ref": "NodeInstanceType"
                },
                "Arch"
              ]
            }
          ]
        },
        "IamInstanceProfile": {
          "Ref": "SecondaryReplicaNode0NodeIAMProfile"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "SecondaryReplicaNode0"
          },
          {
            "Key": "ClusterReplicaSetCount",
            "Value": {
              "Ref": "ClusterReplicaSetCount"
            }
          },
          {
            "Key": "NodeReplicaSetIndex",
            "Value": "1"
          },
          {
            "Key": "ClusterShardCount",
            "Value": {
              "Ref": "ClusterShardCount"
            }
          },
          {
            "Key": "ShardsPerNode",
            "Value": {
              "Ref": "ShardsPerNode"
            }
          },
          {
            "Key": "NodeShardIndex",
            "Value": "-1"
          }
        ],
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvdg",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "250"
            }
          },
          {
            "DeviceName": "/dev/xvdh",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "200"
            }
          },
          {
            "DeviceName": "/dev/xvdf",
            "Ebs": {
              "VolumeSize": {
                "Ref": "VolumeSize"
              },
              "VolumeType": "io1",
              "Iops": {
                "Ref": "Iops"
              },
              "DeleteOnTermination": "true"
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -v\n",
                "mkdir -p /home/ec2-user/mongodb \n",
                "cd /home/ec2-user/mongodb \n",
                "# Wait until the NAT initializes and Internet is available \n",
                "until ping -c 1 ietf.org \n",
                "do \n",
                "sleep 5; \n",
                "done \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/orchestrator.sh orchestrator.sh\n",
                "chmod +x orchestrator.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/init.sh init.sh\n",
                "chmod +x init.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/signalFinalStatus.sh signalFinalStatus.sh\n",
                "chmod +x signalFinalStatus.sh \n",
                "#  Run the install \n",
                "#  Store stack name to tag DDB name\n",
                "echo ",
                {
                  "Fn::Join": [
                    "_",
                    [
                      "export TABLE_NAMETAG=",
                      {
                        "Ref": "AWS::StackName"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export VPC=",
                      {
                        "Ref": "VPC"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export MongoDBVersion=",
                      {
                        "Ref": "MongoDBVersion"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "#  Store WaitHandler\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "\"",
                      "export WAITHANDLER='",
                      {
                        "Ref": "SecondaryReplicaNode0WaitForNodeInstallWaitHandle"
                      },
                      "'",
                      "\""
                    ]
                  ]
                },
                " >> config.sh\n",
                "./init.sh > install.log 2>&1 \n",
                "#  Cleanup \n",
                "#rm -rf *\n",
                "chown -R ec2-user:ec2-user /home/ec2-user/ \n",
                "# All is well so signal success\n",
                "/home/ec2-user/mongodb/signalFinalStatus.sh 0\n"
              ]
            ]
          }
        },
        "InstanceType": {
          "Ref": "NodeInstanceType"
        }
      }
    },
    "SecondaryReplicaNode00NodeInterface": {
      "Type": "AWS::EC2::NetworkInterface",
      "Properties": {
        "Description": "Network Interface for Mongo Node",
        "SubnetId": {
          "Ref": "Secondary0NodeSubnet"
        },
        "GroupSet": [
          {
            "Ref": "SecondaryReplicaNode00NodeSecurityGroup"
          }
        ],
        "SourceDestCheck": "true",
        "Tags": [
          {
            "Key": "Network",
            "Value": "Private"
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode00"
    },
    "SecondaryReplicaNode00NodeSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Enable external access and allow communication (Trim as needed)",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": "27017",
            "ToPort": "27030",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "28017",
            "ToPort": "28017",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "22",
            "ToPort": "22",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "FromPort": "1",
            "ToPort": "65535"
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode00"
    },
    "SecondaryReplicaNode00NodeIAMRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "ec2.amazonaws.com"
                ]
              },
              "Action": [
                "sts:AssumeRole"
              ]
            }
          ]
        },
        "Path": "/",
        "Policies": [
          {
            "PolicyName": "Backup",
            "PolicyDocument": {
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:*",
                    "ec2:Describe*",
                    "ec2:AttachNetworkInterface",
                    "ec2:AttachVolume",
                    "ec2:CreateTags",
                    "ec2:CreateVolume",
                    "ec2:RunInstances",
                    "ec2:StartInstances",
                    "ec2:DeleteVolume",
                    "ec2:CreateSecurityGroup",
                    "ec2:CreateSnapshot"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:*",
                    "dynamodb:Scan",
                    "dynamodb:Query",
                    "dynamodb:GetItem",
                    "dynamodb:BatchGetItem",
                    "dynamodb:UpdateTable"
                  ],
                  "Resource": [
                    "*"
                  ]
                }
              ]
            }
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode00"
    },
    "SecondaryReplicaNode00NodeIAMProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Path": "/",
        "Roles": [
          {
            "Ref": "SecondaryReplicaNode00NodeIAMRole"
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode00"
    },
    "SecondaryReplicaNode00WaitForNodeInstallIO1": {
      "Type": "AWS::CloudFormation::WaitCondition",
      "DependsOn": "SecondaryReplicaNode00NodeInstanceIO1",
      "Condition": "UsePIopsAndIfSecondaryReplicaNode00",
      "Properties": {
        "Handle": {
          "Ref": "SecondaryReplicaNode00WaitForNodeInstallWaitHandle"
        },
        "Timeout": "3600"
      }
    },
    "SecondaryReplicaNode00WaitForNodeInstallGP2": {
      "Type": "AWS::CloudFormation::WaitCondition",
      "DependsOn": "SecondaryReplicaNode00NodeInstanceGP2",
      "Condition": "UseGP2AndIfSecondaryReplicaNode00",
      "Properties": {
        "Handle": {
          "Ref": "SecondaryReplicaNode00WaitForNodeInstallWaitHandle"
        },
        "Timeout": "3600"
      }
    },
    "SecondaryReplicaNode00WaitForNodeInstallWaitHandle": {
      "Type": "AWS::CloudFormation::WaitConditionHandle",
      "Properties": {},
      "Condition": "IfSecondaryReplicaNode00"
    },
    "SecondaryReplicaNode00NodeInstanceGP2": {
      "Type": "AWS::EC2::Instance",
      "Condition": "UseGP2AndIfSecondaryReplicaNode00",
      "Metadata": {
        "HostRole": "MongoDB Node"
      },
      "Properties": {
        "NetworkInterfaces": [
          {
            "NetworkInterfaceId": {
              "Ref": "SecondaryReplicaNode00NodeInterface"
            },
            "DeviceIndex": "0"
          }
        ],
        "KeyName": {
          "Ref": "KeyName"
        },
        "ImageId": {
          "Fn::FindInMap": [
            "AMI",
            {
              "Ref": "AWS::Region"
            },
            {
              "Fn::FindInMap": [
                "InstanceTypeArch",
                {
                  "Ref": "NodeInstanceType"
                },
                "Arch"
              ]
            }
          ]
        },
        "IamInstanceProfile": {
          "Ref": "SecondaryReplicaNode00NodeIAMProfile"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "SecondaryReplicaNode00"
          },
          {
            "Key": "ClusterReplicaSetCount",
            "Value": {
              "Ref": "ClusterReplicaSetCount"
            }
          },
          {
            "Key": "NodeReplicaSetIndex",
            "Value": "1"
          },
          {
            "Key": "ClusterShardCount",
            "Value": {
              "Ref": "ClusterShardCount"
            }
          },
          {
            "Key": "ShardsPerNode",
            "Value": {
              "Ref": "ShardsPerNode"
            }
          },
          {
            "Key": "NodeShardIndex",
            "Value": "0"
          }
        ],
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvdg",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "250"
            }
          },
          {
            "DeviceName": "/dev/xvdh",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "200"
            }
          },
          {
            "DeviceName": "/dev/xvdf",
            "Ebs": {
              "VolumeSize": {
                "Ref": "VolumeSize"
              },
              "VolumeType": "gp2",
              "DeleteOnTermination": "true"
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -v\n",
                "mkdir -p /home/ec2-user/mongodb \n",
                "cd /home/ec2-user/mongodb \n",
                "# Wait until the NAT initializes and Internet is available \n",
                "until ping -c 1 ietf.org \n",
                "do \n",
                "sleep 5; \n",
                "done \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/orchestrator.sh orchestrator.sh\n",
                "chmod +x orchestrator.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/init.sh init.sh\n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/signalFinalStatus.sh signalFinalStatus.sh\n",
                "chmod +x signalFinalStatus.sh \n",
                "chmod +x init.sh \n",
                "#  Run the install \n",
                "#  Store stack name to tag DDB name\n",
                "echo ",
                {
                  "Fn::Join": [
                    "_",
                    [
                      "export TABLE_NAMETAG=",
                      {
                        "Ref": "AWS::StackName"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export MongoDBVersion=",
                      {
                        "Ref": "MongoDBVersion"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export VPC=",
                      {
                        "Ref": "VPC"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "#  Store WaitHandler\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "\"",
                      "export WAITHANDLER='",
                      {
                        "Ref": "SecondaryReplicaNode00WaitForNodeInstallWaitHandle"
                      },
                      "'",
                      "\""
                    ]
                  ]
                },
                " >> config.sh\n",
                "./init.sh > install.log 2>&1 \n",
                "#  Cleanup \n",
                "#rm -rf *\n",
                "chown -R ec2-user:ec2-user /home/ec2-user/ \n",
                "/home/ec2-user/mongodb/signalFinalStatus.sh 0\n"
              ]
            ]
          }
        },
        "InstanceType": {
          "Ref": "NodeInstanceType"
        }
      }
    },
    "SecondaryReplicaNode00NodeInstanceIO1": {
      "Type": "AWS::EC2::Instance",
      "Condition": "UsePIopsAndIfSecondaryReplicaNode00",
      "Metadata": {
        "HostRole": "MongoDB Node"
      },
      "Properties": {
        "NetworkInterfaces": [
          {
            "NetworkInterfaceId": {
              "Ref": "SecondaryReplicaNode00NodeInterface"
            },
            "DeviceIndex": "0"
          }
        ],
        "KeyName": {
          "Ref": "KeyName"
        },
        "ImageId": {
          "Fn::FindInMap": [
            "AMI",
            {
              "Ref": "AWS::Region"
            },
            {
              "Fn::FindInMap": [
                "InstanceTypeArch",
                {
                  "Ref": "NodeInstanceType"
                },
                "Arch"
              ]
            }
          ]
        },
        "IamInstanceProfile": {
          "Ref": "SecondaryReplicaNode00NodeIAMProfile"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "SecondaryReplicaNode00"
          },
          {
            "Key": "ClusterReplicaSetCount",
            "Value": {
              "Ref": "ClusterReplicaSetCount"
            }
          },
          {
            "Key": "NodeReplicaSetIndex",
            "Value": "1"
          },
          {
            "Key": "ClusterShardCount",
            "Value": {
              "Ref": "ClusterShardCount"
            }
          },
          {
            "Key": "ShardsPerNode",
            "Value": {
              "Ref": "ShardsPerNode"
            }
          },
          {
            "Key": "NodeShardIndex",
            "Value": "0"
          }
        ],
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvdg",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "250"
            }
          },
          {
            "DeviceName": "/dev/xvdh",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "200"
            }
          },
          {
            "DeviceName": "/dev/xvdf",
            "Ebs": {
              "VolumeSize": {
                "Ref": "VolumeSize"
              },
              "VolumeType": "io1",
              "Iops": {
                "Ref": "Iops"
              },
              "DeleteOnTermination": "true"
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -v\n",
                "mkdir -p /home/ec2-user/mongodb \n",
                "cd /home/ec2-user/mongodb \n",
                "# Wait until the NAT initializes and Internet is available \n",
                "until ping -c 1 ietf.org \n",
                "do \n",
                "sleep 5; \n",
                "done \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/orchestrator.sh orchestrator.sh\n",
                "chmod +x orchestrator.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/init.sh init.sh\n",
                "chmod +x init.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/signalFinalStatus.sh signalFinalStatus.sh\n",
                "chmod +x signalFinalStatus.sh \n",
                "#  Run the install \n",
                "#  Store stack name to tag DDB name\n",
                "echo ",
                {
                  "Fn::Join": [
                    "_",
                    [
                      "export TABLE_NAMETAG=",
                      {
                        "Ref": "AWS::StackName"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export VPC=",
                      {
                        "Ref": "VPC"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export MongoDBVersion=",
                      {
                        "Ref": "MongoDBVersion"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "#  Store WaitHandler\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "\"",
                      "export WAITHANDLER='",
                      {
                        "Ref": "SecondaryReplicaNode00WaitForNodeInstallWaitHandle"
                      },
                      "'",
                      "\""
                    ]
                  ]
                },
                " >> config.sh\n",
                "./init.sh > install.log 2>&1 \n",
                "#  Cleanup \n",
                "#rm -rf *\n",
                "chown -R ec2-user:ec2-user /home/ec2-user/ \n",
                "# All is well so signal success\n",
                "/home/ec2-user/mongodb/signalFinalStatus.sh 0\n"
              ]
            ]
          }
        },
        "InstanceType": {
          "Ref": "NodeInstanceType"
        }
      }
    },
    "SecondaryReplicaNode1NodeInterface": {
      "Type": "AWS::EC2::NetworkInterface",
      "Properties": {
        "Description": "Network Interface for Mongo Node",
        "SubnetId": {
          "Ref": "Secondary1NodeSubnet"
        },
        "GroupSet": [
          {
            "Ref": "SecondaryReplicaNode1NodeSecurityGroup"
          }
        ],
        "SourceDestCheck": "true",
        "Tags": [
          {
            "Key": "Network",
            "Value": "Private"
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode1"
    },
    "SecondaryReplicaNode1NodeSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Enable external access and allow communication (Trim as needed)",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": "27017",
            "ToPort": "27030",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "28017",
            "ToPort": "28017",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "22",
            "ToPort": "22",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "FromPort": "1",
            "ToPort": "65535"
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode1"
    },
    "SecondaryReplicaNode1NodeIAMRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "ec2.amazonaws.com"
                ]
              },
              "Action": [
                "sts:AssumeRole"
              ]
            }
          ]
        },
        "Path": "/",
        "Policies": [
          {
            "PolicyName": "Backup",
            "PolicyDocument": {
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:*",
                    "ec2:Describe*",
                    "ec2:AttachNetworkInterface",
                    "ec2:AttachVolume",
                    "ec2:CreateTags",
                    "ec2:CreateVolume",
                    "ec2:RunInstances",
                    "ec2:StartInstances",
                    "ec2:DeleteVolume",
                    "ec2:CreateSecurityGroup",
                    "ec2:CreateSnapshot"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:*",
                    "dynamodb:Scan",
                    "dynamodb:Query",
                    "dynamodb:GetItem",
                    "dynamodb:BatchGetItem",
                    "dynamodb:UpdateTable"
                  ],
                  "Resource": [
                    "*"
                  ]
                }
              ]
            }
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode1"
    },
    "SecondaryReplicaNode1NodeIAMProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Path": "/",
        "Roles": [
          {
            "Ref": "SecondaryReplicaNode1NodeIAMRole"
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode1"
    },
    "SecondaryReplicaNode1WaitForNodeInstallIO1": {
      "Type": "AWS::CloudFormation::WaitCondition",
      "DependsOn": "SecondaryReplicaNode1NodeInstanceIO1",
      "Condition": "UsePIopsAndIfSecondaryReplicaNode1",
      "Properties": {
        "Handle": {
          "Ref": "SecondaryReplicaNode1WaitForNodeInstallWaitHandle"
        },
        "Timeout": "3600"
      }
    },
    "SecondaryReplicaNode1WaitForNodeInstallGP2": {
      "Type": "AWS::CloudFormation::WaitCondition",
      "DependsOn": "SecondaryReplicaNode1NodeInstanceGP2",
      "Condition": "UseGP2AndIfSecondaryReplicaNode1",
      "Properties": {
        "Handle": {
          "Ref": "SecondaryReplicaNode1WaitForNodeInstallWaitHandle"
        },
        "Timeout": "3600"
      }
    },
    "SecondaryReplicaNode1WaitForNodeInstallWaitHandle": {
      "Type": "AWS::CloudFormation::WaitConditionHandle",
      "Properties": {},
      "Condition": "IfSecondaryReplicaNode1"
    },
    "SecondaryReplicaNode1NodeInstanceGP2": {
      "Type": "AWS::EC2::Instance",
      "Condition": "UseGP2AndIfSecondaryReplicaNode1",
      "Metadata": {
        "HostRole": "MongoDB Node"
      },
      "Properties": {
        "NetworkInterfaces": [
          {
            "NetworkInterfaceId": {
              "Ref": "SecondaryReplicaNode1NodeInterface"
            },
            "DeviceIndex": "0"
          }
        ],
        "KeyName": {
          "Ref": "KeyName"
        },
        "ImageId": {
          "Fn::FindInMap": [
            "AMI",
            {
              "Ref": "AWS::Region"
            },
            {
              "Fn::FindInMap": [
                "InstanceTypeArch",
                {
                  "Ref": "NodeInstanceType"
                },
                "Arch"
              ]
            }
          ]
        },
        "IamInstanceProfile": {
          "Ref": "SecondaryReplicaNode1NodeIAMProfile"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "SecondaryReplicaNode1"
          },
          {
            "Key": "ClusterReplicaSetCount",
            "Value": {
              "Ref": "ClusterReplicaSetCount"
            }
          },
          {
            "Key": "NodeReplicaSetIndex",
            "Value": "2"
          },
          {
            "Key": "ClusterShardCount",
            "Value": {
              "Ref": "ClusterShardCount"
            }
          },
          {
            "Key": "ShardsPerNode",
            "Value": {
              "Ref": "ShardsPerNode"
            }
          },
          {
            "Key": "NodeShardIndex",
            "Value": "-1"
          }
        ],
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvdg",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "250"
            }
          },
          {
            "DeviceName": "/dev/xvdh",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "200"
            }
          },
          {
            "DeviceName": "/dev/xvdf",
            "Ebs": {
              "VolumeSize": {
                "Ref": "VolumeSize"
              },
              "VolumeType": "gp2",
              "DeleteOnTermination": "true"
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -v\n",
                "mkdir -p /home/ec2-user/mongodb \n",
                "cd /home/ec2-user/mongodb \n",
                "# Wait until the NAT initializes and Internet is available \n",
                "until ping -c 1 ietf.org \n",
                "do \n",
                "sleep 5; \n",
                "done \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/orchestrator.sh orchestrator.sh\n",
                "chmod +x orchestrator.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/init.sh init.sh\n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/signalFinalStatus.sh signalFinalStatus.sh\n",
                "chmod +x signalFinalStatus.sh \n",
                "chmod +x init.sh \n",
                "#  Run the install \n",
                "#  Store stack name to tag DDB name\n",
                "echo ",
                {
                  "Fn::Join": [
                    "_",
                    [
                      "export TABLE_NAMETAG=",
                      {
                        "Ref": "AWS::StackName"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export MongoDBVersion=",
                      {
                        "Ref": "MongoDBVersion"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export VPC=",
                      {
                        "Ref": "VPC"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "#  Store WaitHandler\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "\"",
                      "export WAITHANDLER='",
                      {
                        "Ref": "SecondaryReplicaNode1WaitForNodeInstallWaitHandle"
                      },
                      "'",
                      "\""
                    ]
                  ]
                },
                " >> config.sh\n",
                "./init.sh > install.log 2>&1 \n",
                "#  Cleanup \n",
                "#rm -rf *\n",
                "chown -R ec2-user:ec2-user /home/ec2-user/ \n",
                "/home/ec2-user/mongodb/signalFinalStatus.sh 0\n"
              ]
            ]
          }
        },
        "InstanceType": {
          "Ref": "NodeInstanceType"
        }
      }
    },
    "SecondaryReplicaNode1NodeInstanceIO1": {
      "Type": "AWS::EC2::Instance",
      "Condition": "UsePIopsAndIfSecondaryReplicaNode1",
      "Metadata": {
        "HostRole": "MongoDB Node"
      },
      "Properties": {
        "NetworkInterfaces": [
          {
            "NetworkInterfaceId": {
              "Ref": "SecondaryReplicaNode1NodeInterface"
            },
            "DeviceIndex": "0"
          }
        ],
        "KeyName": {
          "Ref": "KeyName"
        },
        "ImageId": {
          "Fn::FindInMap": [
            "AMI",
            {
              "Ref": "AWS::Region"
            },
            {
              "Fn::FindInMap": [
                "InstanceTypeArch",
                {
                  "Ref": "NodeInstanceType"
                },
                "Arch"
              ]
            }
          ]
        },
        "IamInstanceProfile": {
          "Ref": "SecondaryReplicaNode1NodeIAMProfile"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "SecondaryReplicaNode1"
          },
          {
            "Key": "ClusterReplicaSetCount",
            "Value": {
              "Ref": "ClusterReplicaSetCount"
            }
          },
          {
            "Key": "NodeReplicaSetIndex",
            "Value": "2"
          },
          {
            "Key": "ClusterShardCount",
            "Value": {
              "Ref": "ClusterShardCount"
            }
          },
          {
            "Key": "ShardsPerNode",
            "Value": {
              "Ref": "ShardsPerNode"
            }
          },
          {
            "Key": "NodeShardIndex",
            "Value": "-1"
          }
        ],
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvdg",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "250"
            }
          },
          {
            "DeviceName": "/dev/xvdh",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "200"
            }
          },
          {
            "DeviceName": "/dev/xvdf",
            "Ebs": {
              "VolumeSize": {
                "Ref": "VolumeSize"
              },
              "VolumeType": "io1",
              "Iops": {
                "Ref": "Iops"
              },
              "DeleteOnTermination": "true"
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -v\n",
                "mkdir -p /home/ec2-user/mongodb \n",
                "cd /home/ec2-user/mongodb \n",
                "# Wait until the NAT initializes and Internet is available \n",
                "until ping -c 1 ietf.org \n",
                "do \n",
                "sleep 5; \n",
                "done \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/orchestrator.sh orchestrator.sh\n",
                "chmod +x orchestrator.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/init.sh init.sh\n",
                "chmod +x init.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/signalFinalStatus.sh signalFinalStatus.sh\n",
                "chmod +x signalFinalStatus.sh \n",
                "#  Run the install \n",
                "#  Store stack name to tag DDB name\n",
                "echo ",
                {
                  "Fn::Join": [
                    "_",
                    [
                      "export TABLE_NAMETAG=",
                      {
                        "Ref": "AWS::StackName"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export VPC=",
                      {
                        "Ref": "VPC"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export MongoDBVersion=",
                      {
                        "Ref": "MongoDBVersion"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "#  Store WaitHandler\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "\"",
                      "export WAITHANDLER='",
                      {
                        "Ref": "SecondaryReplicaNode1WaitForNodeInstallWaitHandle"
                      },
                      "'",
                      "\""
                    ]
                  ]
                },
                " >> config.sh\n",
                "./init.sh > install.log 2>&1 \n",
                "#  Cleanup \n",
                "#rm -rf *\n",
                "chown -R ec2-user:ec2-user /home/ec2-user/ \n",
                "# All is well so signal success\n",
                "/home/ec2-user/mongodb/signalFinalStatus.sh 0\n"
              ]
            ]
          }
        },
        "InstanceType": {
          "Ref": "NodeInstanceType"
        }
      }
    },
    "SecondaryReplicaNode01NodeInterface": {
      "Type": "AWS::EC2::NetworkInterface",
      "Properties": {
        "Description": "Network Interface for Mongo Node",
        "SubnetId": {
          "Ref": "Secondary1NodeSubnet"
        },
        "GroupSet": [
          {
            "Ref": "SecondaryReplicaNode01NodeSecurityGroup"
          }
        ],
        "SourceDestCheck": "true",
        "Tags": [
          {
            "Key": "Network",
            "Value": "Private"
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode01"
    },
    "SecondaryReplicaNode01NodeSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Enable external access and allow communication (Trim as needed)",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": "27017",
            "ToPort": "27030",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "28017",
            "ToPort": "28017",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "22",
            "ToPort": "22",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "FromPort": "1",
            "ToPort": "65535"
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode01"
    },
    "SecondaryReplicaNode01NodeIAMRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "ec2.amazonaws.com"
                ]
              },
              "Action": [
                "sts:AssumeRole"
              ]
            }
          ]
        },
        "Path": "/",
        "Policies": [
          {
            "PolicyName": "Backup",
            "PolicyDocument": {
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:*",
                    "ec2:Describe*",
                    "ec2:AttachNetworkInterface",
                    "ec2:AttachVolume",
                    "ec2:CreateTags",
                    "ec2:CreateVolume",
                    "ec2:RunInstances",
                    "ec2:StartInstances",
                    "ec2:DeleteVolume",
                    "ec2:CreateSecurityGroup",
                    "ec2:CreateSnapshot"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:*",
                    "dynamodb:Scan",
                    "dynamodb:Query",
                    "dynamodb:GetItem",
                    "dynamodb:BatchGetItem",
                    "dynamodb:UpdateTable"
                  ],
                  "Resource": [
                    "*"
                  ]
                }
              ]
            }
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode01"
    },
    "SecondaryReplicaNode01NodeIAMProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Path": "/",
        "Roles": [
          {
            "Ref": "SecondaryReplicaNode01NodeIAMRole"
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode01"
    },
    "SecondaryReplicaNode01WaitForNodeInstallIO1": {
      "Type": "AWS::CloudFormation::WaitCondition",
      "DependsOn": "SecondaryReplicaNode01NodeInstanceIO1",
      "Condition": "UsePIopsAndIfSecondaryReplicaNode01",
      "Properties": {
        "Handle": {
          "Ref": "SecondaryReplicaNode01WaitForNodeInstallWaitHandle"
        },
        "Timeout": "3600"
      }
    },
    "SecondaryReplicaNode01WaitForNodeInstallGP2": {
      "Type": "AWS::CloudFormation::WaitCondition",
      "DependsOn": "SecondaryReplicaNode01NodeInstanceGP2",
      "Condition": "UseGP2AndIfSecondaryReplicaNode01",
      "Properties": {
        "Handle": {
          "Ref": "SecondaryReplicaNode01WaitForNodeInstallWaitHandle"
        },
        "Timeout": "3600"
      }
    },
    "SecondaryReplicaNode01WaitForNodeInstallWaitHandle": {
      "Type": "AWS::CloudFormation::WaitConditionHandle",
      "Properties": {},
      "Condition": "IfSecondaryReplicaNode01"
    },
    "SecondaryReplicaNode01NodeInstanceGP2": {
      "Type": "AWS::EC2::Instance",
      "Condition": "UseGP2AndIfSecondaryReplicaNode01",
      "Metadata": {
        "HostRole": "MongoDB Node"
      },
      "Properties": {
        "NetworkInterfaces": [
          {
            "NetworkInterfaceId": {
              "Ref": "SecondaryReplicaNode01NodeInterface"
            },
            "DeviceIndex": "0"
          }
        ],
        "KeyName": {
          "Ref": "KeyName"
        },
        "ImageId": {
          "Fn::FindInMap": [
            "AMI",
            {
              "Ref": "AWS::Region"
            },
            {
              "Fn::FindInMap": [
                "InstanceTypeArch",
                {
                  "Ref": "NodeInstanceType"
                },
                "Arch"
              ]
            }
          ]
        },
        "IamInstanceProfile": {
          "Ref": "SecondaryReplicaNode01NodeIAMProfile"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "SecondaryReplicaNode01"
          },
          {
            "Key": "ClusterReplicaSetCount",
            "Value": {
              "Ref": "ClusterReplicaSetCount"
            }
          },
          {
            "Key": "NodeReplicaSetIndex",
            "Value": "2"
          },
          {
            "Key": "ClusterShardCount",
            "Value": {
              "Ref": "ClusterShardCount"
            }
          },
          {
            "Key": "ShardsPerNode",
            "Value": {
              "Ref": "ShardsPerNode"
            }
          },
          {
            "Key": "NodeShardIndex",
            "Value": "0"
          }
        ],
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvdg",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "250"
            }
          },
          {
            "DeviceName": "/dev/xvdh",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "200"
            }
          },
          {
            "DeviceName": "/dev/xvdf",
            "Ebs": {
              "VolumeSize": {
                "Ref": "VolumeSize"
              },
              "VolumeType": "gp2",
              "DeleteOnTermination": "true"
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -v\n",
                "mkdir -p /home/ec2-user/mongodb \n",
                "cd /home/ec2-user/mongodb \n",
                "# Wait until the NAT initializes and Internet is available \n",
                "until ping -c 1 ietf.org \n",
                "do \n",
                "sleep 5; \n",
                "done \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/orchestrator.sh orchestrator.sh\n",
                "chmod +x orchestrator.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/init.sh init.sh\n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/signalFinalStatus.sh signalFinalStatus.sh\n",
                "chmod +x signalFinalStatus.sh \n",
                "chmod +x init.sh \n",
                "#  Run the install \n",
                "#  Store stack name to tag DDB name\n",
                "echo ",
                {
                  "Fn::Join": [
                    "_",
                    [
                      "export TABLE_NAMETAG=",
                      {
                        "Ref": "AWS::StackName"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export MongoDBVersion=",
                      {
                        "Ref": "MongoDBVersion"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export VPC=",
                      {
                        "Ref": "VPC"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "#  Store WaitHandler\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "\"",
                      "export WAITHANDLER='",
                      {
                        "Ref": "SecondaryReplicaNode01WaitForNodeInstallWaitHandle"
                      },
                      "'",
                      "\""
                    ]
                  ]
                },
                " >> config.sh\n",
                "./init.sh > install.log 2>&1 \n",
                "#  Cleanup \n",
                "#rm -rf *\n",
                "chown -R ec2-user:ec2-user /home/ec2-user/ \n",
                "/home/ec2-user/mongodb/signalFinalStatus.sh 0\n"
              ]
            ]
          }
        },
        "InstanceType": {
          "Ref": "NodeInstanceType"
        }
      }
    },
    "SecondaryReplicaNode01NodeInstanceIO1": {
      "Type": "AWS::EC2::Instance",
      "Condition": "UsePIopsAndIfSecondaryReplicaNode01",
      "Metadata": {
        "HostRole": "MongoDB Node"
      },
      "Properties": {
        "NetworkInterfaces": [
          {
            "NetworkInterfaceId": {
              "Ref": "SecondaryReplicaNode01NodeInterface"
            },
            "DeviceIndex": "0"
          }
        ],
        "KeyName": {
          "Ref": "KeyName"
        },
        "ImageId": {
          "Fn::FindInMap": [
            "AMI",
            {
              "Ref": "AWS::Region"
            },
            {
              "Fn::FindInMap": [
                "InstanceTypeArch",
                {
                  "Ref": "NodeInstanceType"
                },
                "Arch"
              ]
            }
          ]
        },
        "IamInstanceProfile": {
          "Ref": "SecondaryReplicaNode01NodeIAMProfile"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "SecondaryReplicaNode01"
          },
          {
            "Key": "ClusterReplicaSetCount",
            "Value": {
              "Ref": "ClusterReplicaSetCount"
            }
          },
          {
            "Key": "NodeReplicaSetIndex",
            "Value": "2"
          },
          {
            "Key": "ClusterShardCount",
            "Value": {
              "Ref": "ClusterShardCount"
            }
          },
          {
            "Key": "ShardsPerNode",
            "Value": {
              "Ref": "ShardsPerNode"
            }
          },
          {
            "Key": "NodeShardIndex",
            "Value": "0"
          }
        ],
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvdg",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "250"
            }
          },
          {
            "DeviceName": "/dev/xvdh",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "200"
            }
          },
          {
            "DeviceName": "/dev/xvdf",
            "Ebs": {
              "VolumeSize": {
                "Ref": "VolumeSize"
              },
              "VolumeType": "io1",
              "Iops": {
                "Ref": "Iops"
              },
              "DeleteOnTermination": "true"
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -v\n",
                "mkdir -p /home/ec2-user/mongodb \n",
                "cd /home/ec2-user/mongodb \n",
                "# Wait until the NAT initializes and Internet is available \n",
                "until ping -c 1 ietf.org \n",
                "do \n",
                "sleep 5; \n",
                "done \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/orchestrator.sh orchestrator.sh\n",
                "chmod +x orchestrator.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/init.sh init.sh\n",
                "chmod +x init.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/signalFinalStatus.sh signalFinalStatus.sh\n",
                "chmod +x signalFinalStatus.sh \n",
                "#  Run the install \n",
                "#  Store stack name to tag DDB name\n",
                "echo ",
                {
                  "Fn::Join": [
                    "_",
                    [
                      "export TABLE_NAMETAG=",
                      {
                        "Ref": "AWS::StackName"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export VPC=",
                      {
                        "Ref": "VPC"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export MongoDBVersion=",
                      {
                        "Ref": "MongoDBVersion"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "#  Store WaitHandler\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "\"",
                      "export WAITHANDLER='",
                      {
                        "Ref": "SecondaryReplicaNode01WaitForNodeInstallWaitHandle"
                      },
                      "'",
                      "\""
                    ]
                  ]
                },
                " >> config.sh\n",
                "./init.sh > install.log 2>&1 \n",
                "#  Cleanup \n",
                "#rm -rf *\n",
                "chown -R ec2-user:ec2-user /home/ec2-user/ \n",
                "# All is well so signal success\n",
                "/home/ec2-user/mongodb/signalFinalStatus.sh 0\n"
              ]
            ]
          }
        },
        "InstanceType": {
          "Ref": "NodeInstanceType"
        }
      }
    },
    "PrimaryReplicaNode10NodeInterface": {
      "Type": "AWS::EC2::NetworkInterface",
      "Properties": {
        "Description": "Network Interface for Mongo Node",
        "SubnetId": {
          "Ref": "PrimaryNodeSubnet"
        },
        "GroupSet": [
          {
            "Ref": "PrimaryReplicaNode10NodeSecurityGroup"
          }
        ],
        "SourceDestCheck": "true",
        "Tags": [
          {
            "Key": "Network",
            "Value": "Private"
          }
        ]
      },
      "Condition": "CreateMinTwoShards"
    },
    "PrimaryReplicaNode10NodeSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Enable external access and allow communication (Trim as needed)",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": "27017",
            "ToPort": "27030",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "28017",
            "ToPort": "28017",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "22",
            "ToPort": "22",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "FromPort": "1",
            "ToPort": "65535"
          }
        ]
      },
      "Condition": "CreateMinTwoShards"
    },
    "PrimaryReplicaNode10NodeIAMRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "ec2.amazonaws.com"
                ]
              },
              "Action": [
                "sts:AssumeRole"
              ]
            }
          ]
        },
        "Path": "/",
        "Policies": [
          {
            "PolicyName": "Backup",
            "PolicyDocument": {
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:*",
                    "ec2:Describe*",
                    "ec2:AttachNetworkInterface",
                    "ec2:AttachVolume",
                    "ec2:CreateTags",
                    "ec2:CreateVolume",
                    "ec2:RunInstances",
                    "ec2:StartInstances",
                    "ec2:DeleteVolume",
                    "ec2:CreateSecurityGroup",
                    "ec2:CreateSnapshot"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:*",
                    "dynamodb:Scan",
                    "dynamodb:Query",
                    "dynamodb:GetItem",
                    "dynamodb:BatchGetItem",
                    "dynamodb:UpdateTable"
                  ],
                  "Resource": [
                    "*"
                  ]
                }
              ]
            }
          }
        ]
      },
      "Condition": "CreateMinTwoShards"
    },
    "PrimaryReplicaNode10NodeIAMProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Path": "/",
        "Roles": [
          {
            "Ref": "PrimaryReplicaNode10NodeIAMRole"
          }
        ]
      },
      "Condition": "CreateMinTwoShards"
    },
    "PrimaryReplicaNode10WaitForNodeInstallIO1": {
      "Type": "AWS::CloudFormation::WaitCondition",
      "DependsOn": "PrimaryReplicaNode10NodeInstanceIO1",
      "Condition": "UsePIopsAndCreateMinTwoShards",
      "Properties": {
        "Handle": {
          "Ref": "PrimaryReplicaNode10WaitForNodeInstallWaitHandle"
        },
        "Timeout": "3600"
      }
    },
    "PrimaryReplicaNode10WaitForNodeInstallGP2": {
      "Type": "AWS::CloudFormation::WaitCondition",
      "DependsOn": "PrimaryReplicaNode10NodeInstanceGP2",
      "Condition": "UseGP2AndCreateMinTwoShards",
      "Properties": {
        "Handle": {
          "Ref": "PrimaryReplicaNode10WaitForNodeInstallWaitHandle"
        },
        "Timeout": "3600"
      }
    },
    "PrimaryReplicaNode10WaitForNodeInstallWaitHandle": {
      "Type": "AWS::CloudFormation::WaitConditionHandle",
      "Properties": {},
      "Condition": "CreateMinTwoShards"
    },
    "PrimaryReplicaNode10NodeInstanceGP2": {
      "Type": "AWS::EC2::Instance",
      "Condition": "UseGP2AndCreateMinTwoShards",
      "Metadata": {
        "HostRole": "MongoDB Node"
      },
      "Properties": {
        "NetworkInterfaces": [
          {
            "NetworkInterfaceId": {
              "Ref": "PrimaryReplicaNode10NodeInterface"
            },
            "DeviceIndex": "0"
          }
        ],
        "KeyName": {
          "Ref": "KeyName"
        },
        "ImageId": {
          "Fn::FindInMap": [
            "AMI",
            {
              "Ref": "AWS::Region"
            },
            {
              "Fn::FindInMap": [
                "InstanceTypeArch",
                {
                  "Ref": "NodeInstanceType"
                },
                "Arch"
              ]
            }
          ]
        },
        "IamInstanceProfile": {
          "Ref": "PrimaryReplicaNode10NodeIAMProfile"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "PrimaryReplicaNode10"
          },
          {
            "Key": "ClusterReplicaSetCount",
            "Value": {
              "Ref": "ClusterReplicaSetCount"
            }
          },
          {
            "Key": "NodeReplicaSetIndex",
            "Value": "0"
          },
          {
            "Key": "ClusterShardCount",
            "Value": {
              "Ref": "ClusterShardCount"
            }
          },
          {
            "Key": "ShardsPerNode",
            "Value": {
              "Ref": "ShardsPerNode"
            }
          },
          {
            "Key": "NodeShardIndex",
            "Value": "1"
          }
        ],
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvdg",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "250"
            }
          },
          {
            "DeviceName": "/dev/xvdh",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "200"
            }
          },
          {
            "DeviceName": "/dev/xvdf",
            "Ebs": {
              "VolumeSize": {
                "Ref": "VolumeSize"
              },
              "VolumeType": "gp2",
              "DeleteOnTermination": "true"
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -v\n",
                "mkdir -p /home/ec2-user/mongodb \n",
                "cd /home/ec2-user/mongodb \n",
                "# Wait until the NAT initializes and Internet is available \n",
                "until ping -c 1 ietf.org \n",
                "do \n",
                "sleep 5; \n",
                "done \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/orchestrator.sh orchestrator.sh\n",
                "chmod +x orchestrator.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/init.sh init.sh\n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/signalFinalStatus.sh signalFinalStatus.sh\n",
                "chmod +x signalFinalStatus.sh \n",
                "chmod +x init.sh \n",
                "#  Run the install \n",
                "#  Store stack name to tag DDB name\n",
                "echo ",
                {
                  "Fn::Join": [
                    "_",
                    [
                      "export TABLE_NAMETAG=",
                      {
                        "Ref": "AWS::StackName"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export MongoDBVersion=",
                      {
                        "Ref": "MongoDBVersion"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export VPC=",
                      {
                        "Ref": "VPC"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "#  Store WaitHandler\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "\"",
                      "export WAITHANDLER='",
                      {
                        "Ref": "PrimaryReplicaNode10WaitForNodeInstallWaitHandle"
                      },
                      "'",
                      "\""
                    ]
                  ]
                },
                " >> config.sh\n",
                "./init.sh > install.log 2>&1 \n",
                "#  Cleanup \n",
                "#rm -rf *\n",
                "chown -R ec2-user:ec2-user /home/ec2-user/ \n",
                "/home/ec2-user/mongodb/signalFinalStatus.sh 0\n"
              ]
            ]
          }
        },
        "InstanceType": {
          "Ref": "NodeInstanceType"
        }
      }
    },
    "PrimaryReplicaNode10NodeInstanceIO1": {
      "Type": "AWS::EC2::Instance",
      "Condition": "UsePIopsAndCreateMinTwoShards",
      "Metadata": {
        "HostRole": "MongoDB Node"
      },
      "Properties": {
        "NetworkInterfaces": [
          {
            "NetworkInterfaceId": {
              "Ref": "PrimaryReplicaNode10NodeInterface"
            },
            "DeviceIndex": "0"
          }
        ],
        "KeyName": {
          "Ref": "KeyName"
        },
        "ImageId": {
          "Fn::FindInMap": [
            "AMI",
            {
              "Ref": "AWS::Region"
            },
            {
              "Fn::FindInMap": [
                "InstanceTypeArch",
                {
                  "Ref": "NodeInstanceType"
                },
                "Arch"
              ]
            }
          ]
        },
        "IamInstanceProfile": {
          "Ref": "PrimaryReplicaNode10NodeIAMProfile"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "PrimaryReplicaNode10"
          },
          {
            "Key": "ClusterReplicaSetCount",
            "Value": {
              "Ref": "ClusterReplicaSetCount"
            }
          },
          {
            "Key": "NodeReplicaSetIndex",
            "Value": "0"
          },
          {
            "Key": "ClusterShardCount",
            "Value": {
              "Ref": "ClusterShardCount"
            }
          },
          {
            "Key": "ShardsPerNode",
            "Value": {
              "Ref": "ShardsPerNode"
            }
          },
          {
            "Key": "NodeShardIndex",
            "Value": "1"
          }
        ],
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvdg",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "250"
            }
          },
          {
            "DeviceName": "/dev/xvdh",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "200"
            }
          },
          {
            "DeviceName": "/dev/xvdf",
            "Ebs": {
              "VolumeSize": {
                "Ref": "VolumeSize"
              },
              "VolumeType": "io1",
              "Iops": {
                "Ref": "Iops"
              },
              "DeleteOnTermination": "true"
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -v\n",
                "mkdir -p /home/ec2-user/mongodb \n",
                "cd /home/ec2-user/mongodb \n",
                "# Wait until the NAT initializes and Internet is available \n",
                "until ping -c 1 ietf.org \n",
                "do \n",
                "sleep 5; \n",
                "done \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/orchestrator.sh orchestrator.sh\n",
                "chmod +x orchestrator.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/init.sh init.sh\n",
                "chmod +x init.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/signalFinalStatus.sh signalFinalStatus.sh\n",
                "chmod +x signalFinalStatus.sh \n",
                "#  Run the install \n",
                "#  Store stack name to tag DDB name\n",
                "echo ",
                {
                  "Fn::Join": [
                    "_",
                    [
                      "export TABLE_NAMETAG=",
                      {
                        "Ref": "AWS::StackName"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export VPC=",
                      {
                        "Ref": "VPC"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export MongoDBVersion=",
                      {
                        "Ref": "MongoDBVersion"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "#  Store WaitHandler\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "\"",
                      "export WAITHANDLER='",
                      {
                        "Ref": "PrimaryReplicaNode10WaitForNodeInstallWaitHandle"
                      },
                      "'",
                      "\""
                    ]
                  ]
                },
                " >> config.sh\n",
                "./init.sh > install.log 2>&1 \n",
                "#  Cleanup \n",
                "#rm -rf *\n",
                "chown -R ec2-user:ec2-user /home/ec2-user/ \n",
                "# All is well so signal success\n",
                "/home/ec2-user/mongodb/signalFinalStatus.sh 0\n"
              ]
            ]
          }
        },
        "InstanceType": {
          "Ref": "NodeInstanceType"
        }
      }
    },
    "SecondaryReplicaNode10NodeInterface": {
      "Type": "AWS::EC2::NetworkInterface",
      "Properties": {
        "Description": "Network Interface for Mongo Node",
        "SubnetId": {
          "Ref": "Secondary0NodeSubnet"
        },
        "GroupSet": [
          {
            "Ref": "SecondaryReplicaNode10NodeSecurityGroup"
          }
        ],
        "SourceDestCheck": "true",
        "Tags": [
          {
            "Key": "Network",
            "Value": "Private"
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode10"
    },
    "SecondaryReplicaNode10NodeSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Enable external access and allow communication (Trim as needed)",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": "27017",
            "ToPort": "27030",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "28017",
            "ToPort": "28017",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "22",
            "ToPort": "22",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "FromPort": "1",
            "ToPort": "65535"
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode10"
    },
    "SecondaryReplicaNode10NodeIAMRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "ec2.amazonaws.com"
                ]
              },
              "Action": [
                "sts:AssumeRole"
              ]
            }
          ]
        },
        "Path": "/",
        "Policies": [
          {
            "PolicyName": "Backup",
            "PolicyDocument": {
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:*",
                    "ec2:Describe*",
                    "ec2:AttachNetworkInterface",
                    "ec2:AttachVolume",
                    "ec2:CreateTags",
                    "ec2:CreateVolume",
                    "ec2:RunInstances",
                    "ec2:StartInstances",
                    "ec2:DeleteVolume",
                    "ec2:CreateSecurityGroup",
                    "ec2:CreateSnapshot"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:*",
                    "dynamodb:Scan",
                    "dynamodb:Query",
                    "dynamodb:GetItem",
                    "dynamodb:BatchGetItem",
                    "dynamodb:UpdateTable"
                  ],
                  "Resource": [
                    "*"
                  ]
                }
              ]
            }
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode10"
    },
    "SecondaryReplicaNode10NodeIAMProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Path": "/",
        "Roles": [
          {
            "Ref": "SecondaryReplicaNode10NodeIAMRole"
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode10"
    },
    "SecondaryReplicaNode10WaitForNodeInstallIO1": {
      "Type": "AWS::CloudFormation::WaitCondition",
      "DependsOn": "SecondaryReplicaNode10NodeInstanceIO1",
      "Condition": "UsePIopsAndIfSecondaryReplicaNode10",
      "Properties": {
        "Handle": {
          "Ref": "SecondaryReplicaNode10WaitForNodeInstallWaitHandle"
        },
        "Timeout": "3600"
      }
    },
    "SecondaryReplicaNode10WaitForNodeInstallGP2": {
      "Type": "AWS::CloudFormation::WaitCondition",
      "DependsOn": "SecondaryReplicaNode10NodeInstanceGP2",
      "Condition": "UseGP2AndIfSecondaryReplicaNode10",
      "Properties": {
        "Handle": {
          "Ref": "SecondaryReplicaNode10WaitForNodeInstallWaitHandle"
        },
        "Timeout": "3600"
      }
    },
    "SecondaryReplicaNode10WaitForNodeInstallWaitHandle": {
      "Type": "AWS::CloudFormation::WaitConditionHandle",
      "Properties": {},
      "Condition": "IfSecondaryReplicaNode10"
    },
    "SecondaryReplicaNode10NodeInstanceGP2": {
      "Type": "AWS::EC2::Instance",
      "Condition": "UseGP2AndIfSecondaryReplicaNode10",
      "Metadata": {
        "HostRole": "MongoDB Node"
      },
      "Properties": {
        "NetworkInterfaces": [
          {
            "NetworkInterfaceId": {
              "Ref": "SecondaryReplicaNode10NodeInterface"
            },
            "DeviceIndex": "0"
          }
        ],
        "KeyName": {
          "Ref": "KeyName"
        },
        "ImageId": {
          "Fn::FindInMap": [
            "AMI",
            {
              "Ref": "AWS::Region"
            },
            {
              "Fn::FindInMap": [
                "InstanceTypeArch",
                {
                  "Ref": "NodeInstanceType"
                },
                "Arch"
              ]
            }
          ]
        },
        "IamInstanceProfile": {
          "Ref": "SecondaryReplicaNode10NodeIAMProfile"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "SecondaryReplicaNode10"
          },
          {
            "Key": "ClusterReplicaSetCount",
            "Value": {
              "Ref": "ClusterReplicaSetCount"
            }
          },
          {
            "Key": "NodeReplicaSetIndex",
            "Value": "1"
          },
          {
            "Key": "ClusterShardCount",
            "Value": {
              "Ref": "ClusterShardCount"
            }
          },
          {
            "Key": "ShardsPerNode",
            "Value": {
              "Ref": "ShardsPerNode"
            }
          },
          {
            "Key": "NodeShardIndex",
            "Value": "1"
          }
        ],
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvdg",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "250"
            }
          },
          {
            "DeviceName": "/dev/xvdh",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "200"
            }
          },
          {
            "DeviceName": "/dev/xvdf",
            "Ebs": {
              "VolumeSize": {
                "Ref": "VolumeSize"
              },
              "VolumeType": "gp2",
              "DeleteOnTermination": "true"
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -v\n",
                "mkdir -p /home/ec2-user/mongodb \n",
                "cd /home/ec2-user/mongodb \n",
                "# Wait until the NAT initializes and Internet is available \n",
                "until ping -c 1 ietf.org \n",
                "do \n",
                "sleep 5; \n",
                "done \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/orchestrator.sh orchestrator.sh\n",
                "chmod +x orchestrator.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/init.sh init.sh\n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/signalFinalStatus.sh signalFinalStatus.sh\n",
                "chmod +x signalFinalStatus.sh \n",
                "chmod +x init.sh \n",
                "#  Run the install \n",
                "#  Store stack name to tag DDB name\n",
                "echo ",
                {
                  "Fn::Join": [
                    "_",
                    [
                      "export TABLE_NAMETAG=",
                      {
                        "Ref": "AWS::StackName"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export MongoDBVersion=",
                      {
                        "Ref": "MongoDBVersion"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export VPC=",
                      {
                        "Ref": "VPC"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "#  Store WaitHandler\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "\"",
                      "export WAITHANDLER='",
                      {
                        "Ref": "SecondaryReplicaNode10WaitForNodeInstallWaitHandle"
                      },
                      "'",
                      "\""
                    ]
                  ]
                },
                " >> config.sh\n",
                "./init.sh > install.log 2>&1 \n",
                "#  Cleanup \n",
                "#rm -rf *\n",
                "chown -R ec2-user:ec2-user /home/ec2-user/ \n",
                "/home/ec2-user/mongodb/signalFinalStatus.sh 0\n"
              ]
            ]
          }
        },
        "InstanceType": {
          "Ref": "NodeInstanceType"
        }
      }
    },
    "SecondaryReplicaNode10NodeInstanceIO1": {
      "Type": "AWS::EC2::Instance",
      "Condition": "UsePIopsAndIfSecondaryReplicaNode10",
      "Metadata": {
        "HostRole": "MongoDB Node"
      },
      "Properties": {
        "NetworkInterfaces": [
          {
            "NetworkInterfaceId": {
              "Ref": "SecondaryReplicaNode10NodeInterface"
            },
            "DeviceIndex": "0"
          }
        ],
        "KeyName": {
          "Ref": "KeyName"
        },
        "ImageId": {
          "Fn::FindInMap": [
            "AMI",
            {
              "Ref": "AWS::Region"
            },
            {
              "Fn::FindInMap": [
                "InstanceTypeArch",
                {
                  "Ref": "NodeInstanceType"
                },
                "Arch"
              ]
            }
          ]
        },
        "IamInstanceProfile": {
          "Ref": "SecondaryReplicaNode10NodeIAMProfile"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "SecondaryReplicaNode10"
          },
          {
            "Key": "ClusterReplicaSetCount",
            "Value": {
              "Ref": "ClusterReplicaSetCount"
            }
          },
          {
            "Key": "NodeReplicaSetIndex",
            "Value": "1"
          },
          {
            "Key": "ClusterShardCount",
            "Value": {
              "Ref": "ClusterShardCount"
            }
          },
          {
            "Key": "ShardsPerNode",
            "Value": {
              "Ref": "ShardsPerNode"
            }
          },
          {
            "Key": "NodeShardIndex",
            "Value": "1"
          }
        ],
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvdg",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "250"
            }
          },
          {
            "DeviceName": "/dev/xvdh",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "200"
            }
          },
          {
            "DeviceName": "/dev/xvdf",
            "Ebs": {
              "VolumeSize": {
                "Ref": "VolumeSize"
              },
              "VolumeType": "io1",
              "Iops": {
                "Ref": "Iops"
              },
              "DeleteOnTermination": "true"
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -v\n",
                "mkdir -p /home/ec2-user/mongodb \n",
                "cd /home/ec2-user/mongodb \n",
                "# Wait until the NAT initializes and Internet is available \n",
                "until ping -c 1 ietf.org \n",
                "do \n",
                "sleep 5; \n",
                "done \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/orchestrator.sh orchestrator.sh\n",
                "chmod +x orchestrator.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/init.sh init.sh\n",
                "chmod +x init.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/signalFinalStatus.sh signalFinalStatus.sh\n",
                "chmod +x signalFinalStatus.sh \n",
                "#  Run the install \n",
                "#  Store stack name to tag DDB name\n",
                "echo ",
                {
                  "Fn::Join": [
                    "_",
                    [
                      "export TABLE_NAMETAG=",
                      {
                        "Ref": "AWS::StackName"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export VPC=",
                      {
                        "Ref": "VPC"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export MongoDBVersion=",
                      {
                        "Ref": "MongoDBVersion"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "#  Store WaitHandler\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "\"",
                      "export WAITHANDLER='",
                      {
                        "Ref": "SecondaryReplicaNode10WaitForNodeInstallWaitHandle"
                      },
                      "'",
                      "\""
                    ]
                  ]
                },
                " >> config.sh\n",
                "./init.sh > install.log 2>&1 \n",
                "#  Cleanup \n",
                "#rm -rf *\n",
                "chown -R ec2-user:ec2-user /home/ec2-user/ \n",
                "# All is well so signal success\n",
                "/home/ec2-user/mongodb/signalFinalStatus.sh 0\n"
              ]
            ]
          }
        },
        "InstanceType": {
          "Ref": "NodeInstanceType"
        }
      }
    },
    "SecondaryReplicaNode11NodeInterface": {
      "Type": "AWS::EC2::NetworkInterface",
      "Properties": {
        "Description": "Network Interface for Mongo Node",
        "SubnetId": {
          "Ref": "Secondary1NodeSubnet"
        },
        "GroupSet": [
          {
            "Ref": "SecondaryReplicaNode11NodeSecurityGroup"
          }
        ],
        "SourceDestCheck": "true",
        "Tags": [
          {
            "Key": "Network",
            "Value": "Private"
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode11"
    },
    "SecondaryReplicaNode11NodeSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Enable external access and allow communication (Trim as needed)",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": "27017",
            "ToPort": "27030",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "28017",
            "ToPort": "28017",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "22",
            "ToPort": "22",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "FromPort": "1",
            "ToPort": "65535"
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode11"
    },
    "SecondaryReplicaNode11NodeIAMRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "ec2.amazonaws.com"
                ]
              },
              "Action": [
                "sts:AssumeRole"
              ]
            }
          ]
        },
        "Path": "/",
        "Policies": [
          {
            "PolicyName": "Backup",
            "PolicyDocument": {
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:*",
                    "ec2:Describe*",
                    "ec2:AttachNetworkInterface",
                    "ec2:AttachVolume",
                    "ec2:CreateTags",
                    "ec2:CreateVolume",
                    "ec2:RunInstances",
                    "ec2:StartInstances",
                    "ec2:DeleteVolume",
                    "ec2:CreateSecurityGroup",
                    "ec2:CreateSnapshot"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:*",
                    "dynamodb:Scan",
                    "dynamodb:Query",
                    "dynamodb:GetItem",
                    "dynamodb:BatchGetItem",
                    "dynamodb:UpdateTable"
                  ],
                  "Resource": [
                    "*"
                  ]
                }
              ]
            }
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode11"
    },
    "SecondaryReplicaNode11NodeIAMProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Path": "/",
        "Roles": [
          {
            "Ref": "SecondaryReplicaNode11NodeIAMRole"
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode11"
    },
    "SecondaryReplicaNode11WaitForNodeInstallIO1": {
      "Type": "AWS::CloudFormation::WaitCondition",
      "DependsOn": "SecondaryReplicaNode11NodeInstanceIO1",
      "Condition": "UsePIopsAndIfSecondaryReplicaNode11",
      "Properties": {
        "Handle": {
          "Ref": "SecondaryReplicaNode11WaitForNodeInstallWaitHandle"
        },
        "Timeout": "3600"
      }
    },
    "SecondaryReplicaNode11WaitForNodeInstallGP2": {
      "Type": "AWS::CloudFormation::WaitCondition",
      "DependsOn": "SecondaryReplicaNode11NodeInstanceGP2",
      "Condition": "UseGP2AndIfSecondaryReplicaNode11",
      "Properties": {
        "Handle": {
          "Ref": "SecondaryReplicaNode11WaitForNodeInstallWaitHandle"
        },
        "Timeout": "3600"
      }
    },
    "SecondaryReplicaNode11WaitForNodeInstallWaitHandle": {
      "Type": "AWS::CloudFormation::WaitConditionHandle",
      "Properties": {},
      "Condition": "IfSecondaryReplicaNode11"
    },
    "SecondaryReplicaNode11NodeInstanceGP2": {
      "Type": "AWS::EC2::Instance",
      "Condition": "UseGP2AndIfSecondaryReplicaNode11",
      "Metadata": {
        "HostRole": "MongoDB Node"
      },
      "Properties": {
        "NetworkInterfaces": [
          {
            "NetworkInterfaceId": {
              "Ref": "SecondaryReplicaNode11NodeInterface"
            },
            "DeviceIndex": "0"
          }
        ],
        "KeyName": {
          "Ref": "KeyName"
        },
        "ImageId": {
          "Fn::FindInMap": [
            "AMI",
            {
              "Ref": "AWS::Region"
            },
            {
              "Fn::FindInMap": [
                "InstanceTypeArch",
                {
                  "Ref": "NodeInstanceType"
                },
                "Arch"
              ]
            }
          ]
        },
        "IamInstanceProfile": {
          "Ref": "SecondaryReplicaNode11NodeIAMProfile"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "SecondaryReplicaNode11"
          },
          {
            "Key": "ClusterReplicaSetCount",
            "Value": {
              "Ref": "ClusterReplicaSetCount"
            }
          },
          {
            "Key": "NodeReplicaSetIndex",
            "Value": "2"
          },
          {
            "Key": "ClusterShardCount",
            "Value": {
              "Ref": "ClusterShardCount"
            }
          },
          {
            "Key": "ShardsPerNode",
            "Value": {
              "Ref": "ShardsPerNode"
            }
          },
          {
            "Key": "NodeShardIndex",
            "Value": "1"
          }
        ],
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvdg",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "250"
            }
          },
          {
            "DeviceName": "/dev/xvdh",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "200"
            }
          },
          {
            "DeviceName": "/dev/xvdf",
            "Ebs": {
              "VolumeSize": {
                "Ref": "VolumeSize"
              },
              "VolumeType": "gp2",
              "DeleteOnTermination": "true"
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -v\n",
                "mkdir -p /home/ec2-user/mongodb \n",
                "cd /home/ec2-user/mongodb \n",
                "# Wait until the NAT initializes and Internet is available \n",
                "until ping -c 1 ietf.org \n",
                "do \n",
                "sleep 5; \n",
                "done \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/orchestrator.sh orchestrator.sh\n",
                "chmod +x orchestrator.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/init.sh init.sh\n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/signalFinalStatus.sh signalFinalStatus.sh\n",
                "chmod +x signalFinalStatus.sh \n",
                "chmod +x init.sh \n",
                "#  Run the install \n",
                "#  Store stack name to tag DDB name\n",
                "echo ",
                {
                  "Fn::Join": [
                    "_",
                    [
                      "export TABLE_NAMETAG=",
                      {
                        "Ref": "AWS::StackName"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export MongoDBVersion=",
                      {
                        "Ref": "MongoDBVersion"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export VPC=",
                      {
                        "Ref": "VPC"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "#  Store WaitHandler\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "\"",
                      "export WAITHANDLER='",
                      {
                        "Ref": "SecondaryReplicaNode11WaitForNodeInstallWaitHandle"
                      },
                      "'",
                      "\""
                    ]
                  ]
                },
                " >> config.sh\n",
                "./init.sh > install.log 2>&1 \n",
                "#  Cleanup \n",
                "#rm -rf *\n",
                "chown -R ec2-user:ec2-user /home/ec2-user/ \n",
                "/home/ec2-user/mongodb/signalFinalStatus.sh 0\n"
              ]
            ]
          }
        },
        "InstanceType": {
          "Ref": "NodeInstanceType"
        }
      }
    },
    "SecondaryReplicaNode11NodeInstanceIO1": {
      "Type": "AWS::EC2::Instance",
      "Condition": "UsePIopsAndIfSecondaryReplicaNode11",
      "Metadata": {
        "HostRole": "MongoDB Node"
      },
      "Properties": {
        "NetworkInterfaces": [
          {
            "NetworkInterfaceId": {
              "Ref": "SecondaryReplicaNode11NodeInterface"
            },
            "DeviceIndex": "0"
          }
        ],
        "KeyName": {
          "Ref": "KeyName"
        },
        "ImageId": {
          "Fn::FindInMap": [
            "AMI",
            {
              "Ref": "AWS::Region"
            },
            {
              "Fn::FindInMap": [
                "InstanceTypeArch",
                {
                  "Ref": "NodeInstanceType"
                },
                "Arch"
              ]
            }
          ]
        },
        "IamInstanceProfile": {
          "Ref": "SecondaryReplicaNode11NodeIAMProfile"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "SecondaryReplicaNode11"
          },
          {
            "Key": "ClusterReplicaSetCount",
            "Value": {
              "Ref": "ClusterReplicaSetCount"
            }
          },
          {
            "Key": "NodeReplicaSetIndex",
            "Value": "2"
          },
          {
            "Key": "ClusterShardCount",
            "Value": {
              "Ref": "ClusterShardCount"
            }
          },
          {
            "Key": "ShardsPerNode",
            "Value": {
              "Ref": "ShardsPerNode"
            }
          },
          {
            "Key": "NodeShardIndex",
            "Value": "1"
          }
        ],
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvdg",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "250"
            }
          },
          {
            "DeviceName": "/dev/xvdh",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "200"
            }
          },
          {
            "DeviceName": "/dev/xvdf",
            "Ebs": {
              "VolumeSize": {
                "Ref": "VolumeSize"
              },
              "VolumeType": "io1",
              "Iops": {
                "Ref": "Iops"
              },
              "DeleteOnTermination": "true"
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -v\n",
                "mkdir -p /home/ec2-user/mongodb \n",
                "cd /home/ec2-user/mongodb \n",
                "# Wait until the NAT initializes and Internet is available \n",
                "until ping -c 1 ietf.org \n",
                "do \n",
                "sleep 5; \n",
                "done \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/orchestrator.sh orchestrator.sh\n",
                "chmod +x orchestrator.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/init.sh init.sh\n",
                "chmod +x init.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/signalFinalStatus.sh signalFinalStatus.sh\n",
                "chmod +x signalFinalStatus.sh \n",
                "#  Run the install \n",
                "#  Store stack name to tag DDB name\n",
                "echo ",
                {
                  "Fn::Join": [
                    "_",
                    [
                      "export TABLE_NAMETAG=",
                      {
                        "Ref": "AWS::StackName"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export VPC=",
                      {
                        "Ref": "VPC"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export MongoDBVersion=",
                      {
                        "Ref": "MongoDBVersion"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "#  Store WaitHandler\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "\"",
                      "export WAITHANDLER='",
                      {
                        "Ref": "SecondaryReplicaNode11WaitForNodeInstallWaitHandle"
                      },
                      "'",
                      "\""
                    ]
                  ]
                },
                " >> config.sh\n",
                "./init.sh > install.log 2>&1 \n",
                "#  Cleanup \n",
                "#rm -rf *\n",
                "chown -R ec2-user:ec2-user /home/ec2-user/ \n",
                "# All is well so signal success\n",
                "/home/ec2-user/mongodb/signalFinalStatus.sh 0\n"
              ]
            ]
          }
        },
        "InstanceType": {
          "Ref": "NodeInstanceType"
        }
      }
    },
    "PrimaryReplicaNode20NodeInterface": {
      "Type": "AWS::EC2::NetworkInterface",
      "Properties": {
        "Description": "Network Interface for Mongo Node",
        "SubnetId": {
          "Ref": "PrimaryNodeSubnet"
        },
        "GroupSet": [
          {
            "Ref": "PrimaryReplicaNode20NodeSecurityGroup"
          }
        ],
        "SourceDestCheck": "true",
        "Tags": [
          {
            "Key": "Network",
            "Value": "Private"
          }
        ]
      },
      "Condition": "CreateMinThreeShards"
    },
    "PrimaryReplicaNode20NodeSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Enable external access and allow communication (Trim as needed)",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": "27017",
            "ToPort": "27030",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "28017",
            "ToPort": "28017",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "22",
            "ToPort": "22",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "FromPort": "1",
            "ToPort": "65535"
          }
        ]
      },
      "Condition": "CreateMinThreeShards"
    },
    "PrimaryReplicaNode20NodeIAMRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "ec2.amazonaws.com"
                ]
              },
              "Action": [
                "sts:AssumeRole"
              ]
            }
          ]
        },
        "Path": "/",
        "Policies": [
          {
            "PolicyName": "Backup",
            "PolicyDocument": {
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:*",
                    "ec2:Describe*",
                    "ec2:AttachNetworkInterface",
                    "ec2:AttachVolume",
                    "ec2:CreateTags",
                    "ec2:CreateVolume",
                    "ec2:RunInstances",
                    "ec2:StartInstances",
                    "ec2:DeleteVolume",
                    "ec2:CreateSecurityGroup",
                    "ec2:CreateSnapshot"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:*",
                    "dynamodb:Scan",
                    "dynamodb:Query",
                    "dynamodb:GetItem",
                    "dynamodb:BatchGetItem",
                    "dynamodb:UpdateTable"
                  ],
                  "Resource": [
                    "*"
                  ]
                }
              ]
            }
          }
        ]
      },
      "Condition": "CreateMinThreeShards"
    },
    "PrimaryReplicaNode20NodeIAMProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Path": "/",
        "Roles": [
          {
            "Ref": "PrimaryReplicaNode20NodeIAMRole"
          }
        ]
      },
      "Condition": "CreateMinThreeShards"
    },
    "PrimaryReplicaNode20WaitForNodeInstallIO1": {
      "Type": "AWS::CloudFormation::WaitCondition",
      "DependsOn": "PrimaryReplicaNode20NodeInstanceIO1",
      "Condition": "UsePIopsAndCreateMinThreeShards",
      "Properties": {
        "Handle": {
          "Ref": "PrimaryReplicaNode20WaitForNodeInstallWaitHandle"
        },
        "Timeout": "3600"
      }
    },
    "PrimaryReplicaNode20WaitForNodeInstallGP2": {
      "Type": "AWS::CloudFormation::WaitCondition",
      "DependsOn": "PrimaryReplicaNode20NodeInstanceGP2",
      "Condition": "UseGP2AndCreateMinThreeShards",
      "Properties": {
        "Handle": {
          "Ref": "PrimaryReplicaNode20WaitForNodeInstallWaitHandle"
        },
        "Timeout": "3600"
      }
    },
    "PrimaryReplicaNode20WaitForNodeInstallWaitHandle": {
      "Type": "AWS::CloudFormation::WaitConditionHandle",
      "Properties": {},
      "Condition": "CreateMinThreeShards"
    },
    "PrimaryReplicaNode20NodeInstanceGP2": {
      "Type": "AWS::EC2::Instance",
      "Condition": "UseGP2AndCreateMinThreeShards",
      "Metadata": {
        "HostRole": "MongoDB Node"
      },
      "Properties": {
        "NetworkInterfaces": [
          {
            "NetworkInterfaceId": {
              "Ref": "PrimaryReplicaNode20NodeInterface"
            },
            "DeviceIndex": "0"
          }
        ],
        "KeyName": {
          "Ref": "KeyName"
        },
        "ImageId": {
          "Fn::FindInMap": [
            "AMI",
            {
              "Ref": "AWS::Region"
            },
            {
              "Fn::FindInMap": [
                "InstanceTypeArch",
                {
                  "Ref": "NodeInstanceType"
                },
                "Arch"
              ]
            }
          ]
        },
        "IamInstanceProfile": {
          "Ref": "PrimaryReplicaNode20NodeIAMProfile"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "PrimaryReplicaNode20"
          },
          {
            "Key": "ClusterReplicaSetCount",
            "Value": {
              "Ref": "ClusterReplicaSetCount"
            }
          },
          {
            "Key": "NodeReplicaSetIndex",
            "Value": "0"
          },
          {
            "Key": "ClusterShardCount",
            "Value": {
              "Ref": "ClusterShardCount"
            }
          },
          {
            "Key": "ShardsPerNode",
            "Value": {
              "Ref": "ShardsPerNode"
            }
          },
          {
            "Key": "NodeShardIndex",
            "Value": "2"
          }
        ],
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvdg",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "250"
            }
          },
          {
            "DeviceName": "/dev/xvdh",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "200"
            }
          },
          {
            "DeviceName": "/dev/xvdf",
            "Ebs": {
              "VolumeSize": {
                "Ref": "VolumeSize"
              },
              "VolumeType": "gp2",
              "DeleteOnTermination": "true"
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -v\n",
                "mkdir -p /home/ec2-user/mongodb \n",
                "cd /home/ec2-user/mongodb \n",
                "# Wait until the NAT initializes and Internet is available \n",
                "until ping -c 1 ietf.org \n",
                "do \n",
                "sleep 5; \n",
                "done \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/orchestrator.sh orchestrator.sh\n",
                "chmod +x orchestrator.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/init.sh init.sh\n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/signalFinalStatus.sh signalFinalStatus.sh\n",
                "chmod +x signalFinalStatus.sh \n",
                "chmod +x init.sh \n",
                "#  Run the install \n",
                "#  Store stack name to tag DDB name\n",
                "echo ",
                {
                  "Fn::Join": [
                    "_",
                    [
                      "export TABLE_NAMETAG=",
                      {
                        "Ref": "AWS::StackName"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export MongoDBVersion=",
                      {
                        "Ref": "MongoDBVersion"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export VPC=",
                      {
                        "Ref": "VPC"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "#  Store WaitHandler\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "\"",
                      "export WAITHANDLER='",
                      {
                        "Ref": "PrimaryReplicaNode20WaitForNodeInstallWaitHandle"
                      },
                      "'",
                      "\""
                    ]
                  ]
                },
                " >> config.sh\n",
                "./init.sh > install.log 2>&1 \n",
                "#  Cleanup \n",
                "#rm -rf *\n",
                "chown -R ec2-user:ec2-user /home/ec2-user/ \n",
                "/home/ec2-user/mongodb/signalFinalStatus.sh 0\n"
              ]
            ]
          }
        },
        "InstanceType": {
          "Ref": "NodeInstanceType"
        }
      }
    },
    "PrimaryReplicaNode20NodeInstanceIO1": {
      "Type": "AWS::EC2::Instance",
      "Condition": "UsePIopsAndCreateMinThreeShards",
      "Metadata": {
        "HostRole": "MongoDB Node"
      },
      "Properties": {
        "NetworkInterfaces": [
          {
            "NetworkInterfaceId": {
              "Ref": "PrimaryReplicaNode20NodeInterface"
            },
            "DeviceIndex": "0"
          }
        ],
        "KeyName": {
          "Ref": "KeyName"
        },
        "ImageId": {
          "Fn::FindInMap": [
            "AMI",
            {
              "Ref": "AWS::Region"
            },
            {
              "Fn::FindInMap": [
                "InstanceTypeArch",
                {
                  "Ref": "NodeInstanceType"
                },
                "Arch"
              ]
            }
          ]
        },
        "IamInstanceProfile": {
          "Ref": "PrimaryReplicaNode20NodeIAMProfile"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "PrimaryReplicaNode20"
          },
          {
            "Key": "ClusterReplicaSetCount",
            "Value": {
              "Ref": "ClusterReplicaSetCount"
            }
          },
          {
            "Key": "NodeReplicaSetIndex",
            "Value": "0"
          },
          {
            "Key": "ClusterShardCount",
            "Value": {
              "Ref": "ClusterShardCount"
            }
          },
          {
            "Key": "ShardsPerNode",
            "Value": {
              "Ref": "ShardsPerNode"
            }
          },
          {
            "Key": "NodeShardIndex",
            "Value": "2"
          }
        ],
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvdg",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "250"
            }
          },
          {
            "DeviceName": "/dev/xvdh",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "200"
            }
          },
          {
            "DeviceName": "/dev/xvdf",
            "Ebs": {
              "VolumeSize": {
                "Ref": "VolumeSize"
              },
              "VolumeType": "io1",
              "Iops": {
                "Ref": "Iops"
              },
              "DeleteOnTermination": "true"
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -v\n",
                "mkdir -p /home/ec2-user/mongodb \n",
                "cd /home/ec2-user/mongodb \n",
                "# Wait until the NAT initializes and Internet is available \n",
                "until ping -c 1 ietf.org \n",
                "do \n",
                "sleep 5; \n",
                "done \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/orchestrator.sh orchestrator.sh\n",
                "chmod +x orchestrator.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/init.sh init.sh\n",
                "chmod +x init.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/signalFinalStatus.sh signalFinalStatus.sh\n",
                "chmod +x signalFinalStatus.sh \n",
                "#  Run the install \n",
                "#  Store stack name to tag DDB name\n",
                "echo ",
                {
                  "Fn::Join": [
                    "_",
                    [
                      "export TABLE_NAMETAG=",
                      {
                        "Ref": "AWS::StackName"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export VPC=",
                      {
                        "Ref": "VPC"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export MongoDBVersion=",
                      {
                        "Ref": "MongoDBVersion"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "#  Store WaitHandler\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "\"",
                      "export WAITHANDLER='",
                      {
                        "Ref": "PrimaryReplicaNode20WaitForNodeInstallWaitHandle"
                      },
                      "'",
                      "\""
                    ]
                  ]
                },
                " >> config.sh\n",
                "./init.sh > install.log 2>&1 \n",
                "#  Cleanup \n",
                "#rm -rf *\n",
                "chown -R ec2-user:ec2-user /home/ec2-user/ \n",
                "# All is well so signal success\n",
                "/home/ec2-user/mongodb/signalFinalStatus.sh 0\n"
              ]
            ]
          }
        },
        "InstanceType": {
          "Ref": "NodeInstanceType"
        }
      }
    },
    "SecondaryReplicaNode20NodeInterface": {
      "Type": "AWS::EC2::NetworkInterface",
      "Properties": {
        "Description": "Network Interface for Mongo Node",
        "SubnetId": {
          "Ref": "Secondary0NodeSubnet"
        },
        "GroupSet": [
          {
            "Ref": "SecondaryReplicaNode20NodeSecurityGroup"
          }
        ],
        "SourceDestCheck": "true",
        "Tags": [
          {
            "Key": "Network",
            "Value": "Private"
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode20"
    },
    "SecondaryReplicaNode20NodeSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Enable external access and allow communication (Trim as needed)",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": "27017",
            "ToPort": "27030",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "28017",
            "ToPort": "28017",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "22",
            "ToPort": "22",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "FromPort": "1",
            "ToPort": "65535"
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode20"
    },
    "SecondaryReplicaNode20NodeIAMRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "ec2.amazonaws.com"
                ]
              },
              "Action": [
                "sts:AssumeRole"
              ]
            }
          ]
        },
        "Path": "/",
        "Policies": [
          {
            "PolicyName": "Backup",
            "PolicyDocument": {
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:*",
                    "ec2:Describe*",
                    "ec2:AttachNetworkInterface",
                    "ec2:AttachVolume",
                    "ec2:CreateTags",
                    "ec2:CreateVolume",
                    "ec2:RunInstances",
                    "ec2:StartInstances",
                    "ec2:DeleteVolume",
                    "ec2:CreateSecurityGroup",
                    "ec2:CreateSnapshot"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:*",
                    "dynamodb:Scan",
                    "dynamodb:Query",
                    "dynamodb:GetItem",
                    "dynamodb:BatchGetItem",
                    "dynamodb:UpdateTable"
                  ],
                  "Resource": [
                    "*"
                  ]
                }
              ]
            }
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode20"
    },
    "SecondaryReplicaNode20NodeIAMProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Path": "/",
        "Roles": [
          {
            "Ref": "SecondaryReplicaNode20NodeIAMRole"
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode20"
    },
    "SecondaryReplicaNode20WaitForNodeInstallIO1": {
      "Type": "AWS::CloudFormation::WaitCondition",
      "DependsOn": "SecondaryReplicaNode20NodeInstanceIO1",
      "Condition": "UsePIopsAndIfSecondaryReplicaNode20",
      "Properties": {
        "Handle": {
          "Ref": "SecondaryReplicaNode20WaitForNodeInstallWaitHandle"
        },
        "Timeout": "3600"
      }
    },
    "SecondaryReplicaNode20WaitForNodeInstallGP2": {
      "Type": "AWS::CloudFormation::WaitCondition",
      "DependsOn": "SecondaryReplicaNode20NodeInstanceGP2",
      "Condition": "UseGP2AndIfSecondaryReplicaNode20",
      "Properties": {
        "Handle": {
          "Ref": "SecondaryReplicaNode20WaitForNodeInstallWaitHandle"
        },
        "Timeout": "3600"
      }
    },
    "SecondaryReplicaNode20WaitForNodeInstallWaitHandle": {
      "Type": "AWS::CloudFormation::WaitConditionHandle",
      "Properties": {},
      "Condition": "IfSecondaryReplicaNode20"
    },
    "SecondaryReplicaNode20NodeInstanceGP2": {
      "Type": "AWS::EC2::Instance",
      "Condition": "UseGP2AndIfSecondaryReplicaNode20",
      "Metadata": {
        "HostRole": "MongoDB Node"
      },
      "Properties": {
        "NetworkInterfaces": [
          {
            "NetworkInterfaceId": {
              "Ref": "SecondaryReplicaNode20NodeInterface"
            },
            "DeviceIndex": "0"
          }
        ],
        "KeyName": {
          "Ref": "KeyName"
        },
        "ImageId": {
          "Fn::FindInMap": [
            "AMI",
            {
              "Ref": "AWS::Region"
            },
            {
              "Fn::FindInMap": [
                "InstanceTypeArch",
                {
                  "Ref": "NodeInstanceType"
                },
                "Arch"
              ]
            }
          ]
        },
        "IamInstanceProfile": {
          "Ref": "SecondaryReplicaNode20NodeIAMProfile"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "SecondaryReplicaNode20"
          },
          {
            "Key": "ClusterReplicaSetCount",
            "Value": {
              "Ref": "ClusterReplicaSetCount"
            }
          },
          {
            "Key": "NodeReplicaSetIndex",
            "Value": "1"
          },
          {
            "Key": "ClusterShardCount",
            "Value": {
              "Ref": "ClusterShardCount"
            }
          },
          {
            "Key": "ShardsPerNode",
            "Value": {
              "Ref": "ShardsPerNode"
            }
          },
          {
            "Key": "NodeShardIndex",
            "Value": "2"
          }
        ],
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvdg",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "250"
            }
          },
          {
            "DeviceName": "/dev/xvdh",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "200"
            }
          },
          {
            "DeviceName": "/dev/xvdf",
            "Ebs": {
              "VolumeSize": {
                "Ref": "VolumeSize"
              },
              "VolumeType": "gp2",
              "DeleteOnTermination": "true"
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -v\n",
                "mkdir -p /home/ec2-user/mongodb \n",
                "cd /home/ec2-user/mongodb \n",
                "# Wait until the NAT initializes and Internet is available \n",
                "until ping -c 1 ietf.org \n",
                "do \n",
                "sleep 5; \n",
                "done \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/orchestrator.sh orchestrator.sh\n",
                "chmod +x orchestrator.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/init.sh init.sh\n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/signalFinalStatus.sh signalFinalStatus.sh\n",
                "chmod +x signalFinalStatus.sh \n",
                "chmod +x init.sh \n",
                "#  Run the install \n",
                "#  Store stack name to tag DDB name\n",
                "echo ",
                {
                  "Fn::Join": [
                    "_",
                    [
                      "export TABLE_NAMETAG=",
                      {
                        "Ref": "AWS::StackName"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export MongoDBVersion=",
                      {
                        "Ref": "MongoDBVersion"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export VPC=",
                      {
                        "Ref": "VPC"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "#  Store WaitHandler\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "\"",
                      "export WAITHANDLER='",
                      {
                        "Ref": "SecondaryReplicaNode20WaitForNodeInstallWaitHandle"
                      },
                      "'",
                      "\""
                    ]
                  ]
                },
                " >> config.sh\n",
                "./init.sh > install.log 2>&1 \n",
                "#  Cleanup \n",
                "#rm -rf *\n",
                "chown -R ec2-user:ec2-user /home/ec2-user/ \n",
                "/home/ec2-user/mongodb/signalFinalStatus.sh 0\n"
              ]
            ]
          }
        },
        "InstanceType": {
          "Ref": "NodeInstanceType"
        }
      }
    },
    "SecondaryReplicaNode20NodeInstanceIO1": {
      "Type": "AWS::EC2::Instance",
      "Condition": "UsePIopsAndIfSecondaryReplicaNode20",
      "Metadata": {
        "HostRole": "MongoDB Node"
      },
      "Properties": {
        "NetworkInterfaces": [
          {
            "NetworkInterfaceId": {
              "Ref": "SecondaryReplicaNode20NodeInterface"
            },
            "DeviceIndex": "0"
          }
        ],
        "KeyName": {
          "Ref": "KeyName"
        },
        "ImageId": {
          "Fn::FindInMap": [
            "AMI",
            {
              "Ref": "AWS::Region"
            },
            {
              "Fn::FindInMap": [
                "InstanceTypeArch",
                {
                  "Ref": "NodeInstanceType"
                },
                "Arch"
              ]
            }
          ]
        },
        "IamInstanceProfile": {
          "Ref": "SecondaryReplicaNode20NodeIAMProfile"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "SecondaryReplicaNode20"
          },
          {
            "Key": "ClusterReplicaSetCount",
            "Value": {
              "Ref": "ClusterReplicaSetCount"
            }
          },
          {
            "Key": "NodeReplicaSetIndex",
            "Value": "1"
          },
          {
            "Key": "ClusterShardCount",
            "Value": {
              "Ref": "ClusterShardCount"
            }
          },
          {
            "Key": "ShardsPerNode",
            "Value": {
              "Ref": "ShardsPerNode"
            }
          },
          {
            "Key": "NodeShardIndex",
            "Value": "2"
          }
        ],
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvdg",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "250"
            }
          },
          {
            "DeviceName": "/dev/xvdh",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "200"
            }
          },
          {
            "DeviceName": "/dev/xvdf",
            "Ebs": {
              "VolumeSize": {
                "Ref": "VolumeSize"
              },
              "VolumeType": "io1",
              "Iops": {
                "Ref": "Iops"
              },
              "DeleteOnTermination": "true"
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -v\n",
                "mkdir -p /home/ec2-user/mongodb \n",
                "cd /home/ec2-user/mongodb \n",
                "# Wait until the NAT initializes and Internet is available \n",
                "until ping -c 1 ietf.org \n",
                "do \n",
                "sleep 5; \n",
                "done \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/orchestrator.sh orchestrator.sh\n",
                "chmod +x orchestrator.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/init.sh init.sh\n",
                "chmod +x init.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/signalFinalStatus.sh signalFinalStatus.sh\n",
                "chmod +x signalFinalStatus.sh \n",
                "#  Run the install \n",
                "#  Store stack name to tag DDB name\n",
                "echo ",
                {
                  "Fn::Join": [
                    "_",
                    [
                      "export TABLE_NAMETAG=",
                      {
                        "Ref": "AWS::StackName"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export VPC=",
                      {
                        "Ref": "VPC"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export MongoDBVersion=",
                      {
                        "Ref": "MongoDBVersion"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "#  Store WaitHandler\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "\"",
                      "export WAITHANDLER='",
                      {
                        "Ref": "SecondaryReplicaNode20WaitForNodeInstallWaitHandle"
                      },
                      "'",
                      "\""
                    ]
                  ]
                },
                " >> config.sh\n",
                "./init.sh > install.log 2>&1 \n",
                "#  Cleanup \n",
                "#rm -rf *\n",
                "chown -R ec2-user:ec2-user /home/ec2-user/ \n",
                "# All is well so signal success\n",
                "/home/ec2-user/mongodb/signalFinalStatus.sh 0\n"
              ]
            ]
          }
        },
        "InstanceType": {
          "Ref": "NodeInstanceType"
        }
      }
    },
    "SecondaryReplicaNode21NodeInterface": {
      "Type": "AWS::EC2::NetworkInterface",
      "Properties": {
        "Description": "Network Interface for Mongo Node",
        "SubnetId": {
          "Ref": "Secondary1NodeSubnet"
        },
        "GroupSet": [
          {
            "Ref": "SecondaryReplicaNode21NodeSecurityGroup"
          }
        ],
        "SourceDestCheck": "true",
        "Tags": [
          {
            "Key": "Network",
            "Value": "Private"
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode21"
    },
    "SecondaryReplicaNode21NodeSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Enable external access and allow communication (Trim as needed)",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": "27017",
            "ToPort": "27030",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "28017",
            "ToPort": "28017",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "22",
            "ToPort": "22",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "FromPort": "1",
            "ToPort": "65535"
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode21"
    },
    "SecondaryReplicaNode21NodeIAMRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "ec2.amazonaws.com"
                ]
              },
              "Action": [
                "sts:AssumeRole"
              ]
            }
          ]
        },
        "Path": "/",
        "Policies": [
          {
            "PolicyName": "Backup",
            "PolicyDocument": {
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:*",
                    "ec2:Describe*",
                    "ec2:AttachNetworkInterface",
                    "ec2:AttachVolume",
                    "ec2:CreateTags",
                    "ec2:CreateVolume",
                    "ec2:RunInstances",
                    "ec2:StartInstances",
                    "ec2:DeleteVolume",
                    "ec2:CreateSecurityGroup",
                    "ec2:CreateSnapshot"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:*",
                    "dynamodb:Scan",
                    "dynamodb:Query",
                    "dynamodb:GetItem",
                    "dynamodb:BatchGetItem",
                    "dynamodb:UpdateTable"
                  ],
                  "Resource": [
                    "*"
                  ]
                }
              ]
            }
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode21"
    },
    "SecondaryReplicaNode21NodeIAMProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Path": "/",
        "Roles": [
          {
            "Ref": "SecondaryReplicaNode21NodeIAMRole"
          }
        ]
      },
      "Condition": "IfSecondaryReplicaNode21"
    },
    "SecondaryReplicaNode21WaitForNodeInstallIO1": {
      "Type": "AWS::CloudFormation::WaitCondition",
      "DependsOn": "SecondaryReplicaNode21NodeInstanceIO1",
      "Condition": "UsePIopsAndIfSecondaryReplicaNode21",
      "Properties": {
        "Handle": {
          "Ref": "SecondaryReplicaNode21WaitForNodeInstallWaitHandle"
        },
        "Timeout": "3600"
      }
    },
    "SecondaryReplicaNode21WaitForNodeInstallGP2": {
      "Type": "AWS::CloudFormation::WaitCondition",
      "DependsOn": "SecondaryReplicaNode21NodeInstanceGP2",
      "Condition": "UseGP2AndIfSecondaryReplicaNode21",
      "Properties": {
        "Handle": {
          "Ref": "SecondaryReplicaNode21WaitForNodeInstallWaitHandle"
        },
        "Timeout": "3600"
      }
    },
    "SecondaryReplicaNode21WaitForNodeInstallWaitHandle": {
      "Type": "AWS::CloudFormation::WaitConditionHandle",
      "Properties": {},
      "Condition": "IfSecondaryReplicaNode21"
    },
    "SecondaryReplicaNode21NodeInstanceGP2": {
      "Type": "AWS::EC2::Instance",
      "Condition": "UseGP2AndIfSecondaryReplicaNode21",
      "Metadata": {
        "HostRole": "MongoDB Node"
      },
      "Properties": {
        "NetworkInterfaces": [
          {
            "NetworkInterfaceId": {
              "Ref": "SecondaryReplicaNode21NodeInterface"
            },
            "DeviceIndex": "0"
          }
        ],
        "KeyName": {
          "Ref": "KeyName"
        },
        "ImageId": {
          "Fn::FindInMap": [
            "AMI",
            {
              "Ref": "AWS::Region"
            },
            {
              "Fn::FindInMap": [
                "InstanceTypeArch",
                {
                  "Ref": "NodeInstanceType"
                },
                "Arch"
              ]
            }
          ]
        },
        "IamInstanceProfile": {
          "Ref": "SecondaryReplicaNode21NodeIAMProfile"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "SecondaryReplicaNode21"
          },
          {
            "Key": "ClusterReplicaSetCount",
            "Value": {
              "Ref": "ClusterReplicaSetCount"
            }
          },
          {
            "Key": "NodeReplicaSetIndex",
            "Value": "2"
          },
          {
            "Key": "ClusterShardCount",
            "Value": {
              "Ref": "ClusterShardCount"
            }
          },
          {
            "Key": "ShardsPerNode",
            "Value": {
              "Ref": "ShardsPerNode"
            }
          },
          {
            "Key": "NodeShardIndex",
            "Value": "2"
          }
        ],
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvdg",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "250"
            }
          },
          {
            "DeviceName": "/dev/xvdh",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "200"
            }
          },
          {
            "DeviceName": "/dev/xvdf",
            "Ebs": {
              "VolumeSize": {
                "Ref": "VolumeSize"
              },
              "VolumeType": "gp2",
              "DeleteOnTermination": "true"
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -v\n",
                "mkdir -p /home/ec2-user/mongodb \n",
                "cd /home/ec2-user/mongodb \n",
                "# Wait until the NAT initializes and Internet is available \n",
                "until ping -c 1 ietf.org \n",
                "do \n",
                "sleep 5; \n",
                "done \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/orchestrator.sh orchestrator.sh\n",
                "chmod +x orchestrator.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/init.sh init.sh\n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/signalFinalStatus.sh signalFinalStatus.sh\n",
                "chmod +x signalFinalStatus.sh \n",
                "chmod +x init.sh \n",
                "#  Run the install \n",
                "#  Store stack name to tag DDB name\n",
                "echo ",
                {
                  "Fn::Join": [
                    "_",
                    [
                      "export TABLE_NAMETAG=",
                      {
                        "Ref": "AWS::StackName"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export MongoDBVersion=",
                      {
                        "Ref": "MongoDBVersion"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export VPC=",
                      {
                        "Ref": "VPC"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "#  Store WaitHandler\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "\"",
                      "export WAITHANDLER='",
                      {
                        "Ref": "SecondaryReplicaNode21WaitForNodeInstallWaitHandle"
                      },
                      "'",
                      "\""
                    ]
                  ]
                },
                " >> config.sh\n",
                "./init.sh > install.log 2>&1 \n",
                "#  Cleanup \n",
                "#rm -rf *\n",
                "chown -R ec2-user:ec2-user /home/ec2-user/ \n",
                "/home/ec2-user/mongodb/signalFinalStatus.sh 0\n"
              ]
            ]
          }
        },
        "InstanceType": {
          "Ref": "NodeInstanceType"
        }
      }
    },
    "SecondaryReplicaNode21NodeInstanceIO1": {
      "Type": "AWS::EC2::Instance",
      "Condition": "UsePIopsAndIfSecondaryReplicaNode21",
      "Metadata": {
        "HostRole": "MongoDB Node"
      },
      "Properties": {
        "NetworkInterfaces": [
          {
            "NetworkInterfaceId": {
              "Ref": "SecondaryReplicaNode21NodeInterface"
            },
            "DeviceIndex": "0"
          }
        ],
        "KeyName": {
          "Ref": "KeyName"
        },
        "ImageId": {
          "Fn::FindInMap": [
            "AMI",
            {
              "Ref": "AWS::Region"
            },
            {
              "Fn::FindInMap": [
                "InstanceTypeArch",
                {
                  "Ref": "NodeInstanceType"
                },
                "Arch"
              ]
            }
          ]
        },
        "IamInstanceProfile": {
          "Ref": "SecondaryReplicaNode21NodeIAMProfile"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "SecondaryReplicaNode21"
          },
          {
            "Key": "ClusterReplicaSetCount",
            "Value": {
              "Ref": "ClusterReplicaSetCount"
            }
          },
          {
            "Key": "NodeReplicaSetIndex",
            "Value": "2"
          },
          {
            "Key": "ClusterShardCount",
            "Value": {
              "Ref": "ClusterShardCount"
            }
          },
          {
            "Key": "ShardsPerNode",
            "Value": {
              "Ref": "ShardsPerNode"
            }
          },
          {
            "Key": "NodeShardIndex",
            "Value": "2"
          }
        ],
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvdg",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "250"
            }
          },
          {
            "DeviceName": "/dev/xvdh",
            "Ebs": {
              "VolumeType": "io1",
              "DeleteOnTermination": "true",
              "VolumeSize": "25",
              "Iops": "200"
            }
          },
          {
            "DeviceName": "/dev/xvdf",
            "Ebs": {
              "VolumeSize": {
                "Ref": "VolumeSize"
              },
              "VolumeType": "io1",
              "Iops": {
                "Ref": "Iops"
              },
              "DeleteOnTermination": "true"
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -v\n",
                "mkdir -p /home/ec2-user/mongodb \n",
                "cd /home/ec2-user/mongodb \n",
                "# Wait until the NAT initializes and Internet is available \n",
                "until ping -c 1 ietf.org \n",
                "do \n",
                "sleep 5; \n",
                "done \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/orchestrator.sh orchestrator.sh\n",
                "chmod +x orchestrator.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/init.sh init.sh\n",
                "chmod +x init.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/signalFinalStatus.sh signalFinalStatus.sh\n",
                "chmod +x signalFinalStatus.sh \n",
                "#  Run the install \n",
                "#  Store stack name to tag DDB name\n",
                "echo ",
                {
                  "Fn::Join": [
                    "_",
                    [
                      "export TABLE_NAMETAG=",
                      {
                        "Ref": "AWS::StackName"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export VPC=",
                      {
                        "Ref": "VPC"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export MongoDBVersion=",
                      {
                        "Ref": "MongoDBVersion"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "#  Store WaitHandler\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "\"",
                      "export WAITHANDLER='",
                      {
                        "Ref": "SecondaryReplicaNode21WaitForNodeInstallWaitHandle"
                      },
                      "'",
                      "\""
                    ]
                  ]
                },
                " >> config.sh\n",
                "./init.sh > install.log 2>&1 \n",
                "#  Cleanup \n",
                "#rm -rf *\n",
                "chown -R ec2-user:ec2-user /home/ec2-user/ \n",
                "# All is well so signal success\n",
                "/home/ec2-user/mongodb/signalFinalStatus.sh 0\n"
              ]
            ]
          }
        },
        "InstanceType": {
          "Ref": "NodeInstanceType"
        }
      }
    },
    "ConfigServer0NodeInterface": {
      "Type": "AWS::EC2::NetworkInterface",
      "Properties": {
        "Description": "Network Interface for Mongo Node",
        "SubnetId": {
          "Ref": "PrimaryNodeSubnet"
        },
        "GroupSet": [
          {
            "Ref": "ConfigServer0NodeSecurityGroup"
          }
        ],
        "SourceDestCheck": "true",
        "Tags": [
          {
            "Key": "Network",
            "Value": "Private"
          }
        ]
      },
      "Condition": "CreateMinOneShard"
    },
    "ConfigServer0NodeSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Enable external access and allow communication (Trim as needed)",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": "27030",
            "ToPort": "27030",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "22",
            "ToPort": "22",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "FromPort": "1",
            "ToPort": "65535"
          }
        ]
      },
      "Condition": "CreateMinOneShard"
    },
    "ConfigServer0NodeIAMRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "ec2.amazonaws.com"
                ]
              },
              "Action": [
                "sts:AssumeRole"
              ]
            }
          ]
        },
        "Path": "/",
        "Policies": [
          {
            "PolicyName": "Backup",
            "PolicyDocument": {
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:*",
                    "ec2:Describe*",
                    "ec2:AttachNetworkInterface",
                    "ec2:AttachVolume",
                    "ec2:CreateTags",
                    "ec2:CreateVolume",
                    "ec2:RunInstances",
                    "ec2:StartInstances",
                    "ec2:DeleteVolume",
                    "ec2:CreateSecurityGroup",
                    "ec2:CreateSnapshot"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:*",
                    "dynamodb:Scan",
                    "dynamodb:Query",
                    "dynamodb:GetItem",
                    "dynamodb:BatchGetItem",
                    "dynamodb:UpdateTable"
                  ],
                  "Resource": [
                    "*"
                  ]
                }
              ]
            }
          }
        ]
      },
      "Condition": "CreateMinOneShard"
    },
    "ConfigServer0NodeIAMProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Path": "/",
        "Roles": [
          {
            "Ref": "ConfigServer0NodeIAMRole"
          }
        ]
      },
      "Condition": "CreateMinOneShard"
    },
    "ConfigServer0WaitForNodeInstall": {
      "Type": "AWS::CloudFormation::WaitCondition",
      "DependsOn": "ConfigServer0NodeInstance",
      "Properties": {
        "Handle": {
          "Ref": "ConfigServer0WaitForNodeInstallWaitHandle"
        },
        "Timeout": "3600"
      },
      "Condition": "CreateMinOneShard"
    },
    "ConfigServer0WaitForNodeInstallWaitHandle": {
      "Type": "AWS::CloudFormation::WaitConditionHandle",
      "Properties": {},
      "Condition": "CreateMinOneShard"
    },
    "ConfigServer0NodeInstance": {
      "Type": "AWS::EC2::Instance",
      "Metadata": {
        "HostRole": "MongoDB Node"
      },
      "Properties": {
        "NetworkInterfaces": [
          {
            "NetworkInterfaceId": {
              "Ref": "ConfigServer0NodeInterface"
            },
            "DeviceIndex": "0"
          }
        ],
        "KeyName": {
          "Ref": "KeyName"
        },
        "ImageId": {
          "Fn::FindInMap": [
            "AMI",
            {
              "Ref": "AWS::Region"
            },
            {
              "Fn::FindInMap": [
                "InstanceTypeArch",
                {
                  "Ref": "NodeInstanceType"
                },
                "Arch"
              ]
            }
          ]
        },
        "IamInstanceProfile": {
          "Ref": "ConfigServer0NodeIAMProfile"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "ConfigServer0"
          },
          {
            "Key": "ClusterReplicaSetCount",
            "Value": {
              "Ref": "ClusterReplicaSetCount"
            }
          },
          {
            "Key": "ClusterShardCount",
            "Value": {
              "Ref": "ClusterShardCount"
            }
          },
          {
            "Key": "ConfigServerIndex",
            "Value": "0"
          }
        ],
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvdf",
            "Ebs": {
              "VolumeType": "gp2",
              "DeleteOnTermination": "true",
              "VolumeSize": "40"
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -v\n",
                "mkdir -p /home/ec2-user/mongodb \n",
                "cd /home/ec2-user/mongodb \n",
                "# Wait until the NAT initializes and Internet is available \n",
                "until ping -c 1 ietf.org \n",
                "do \n",
                "sleep 5; \n",
                "done \n",
                "##curl -OL https://s3-us-west-2.amazonaws.com/rh-public/orchestrator.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/orchestrator.sh orchestrator.sh\n",
                "chmod +x orchestrator.sh \n",
                "##curl -OL https://s3-us-west-2.amazonaws.com/rh-public/init.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/init.sh init.sh\n",
                "chmod +x init.sh \n",
                "#  Run the install \n",
                "#  Store stack name to tag DDB name\n",
                "echo ",
                {
                  "Fn::Join": [
                    "_",
                    [
                      "export TABLE_NAMETAG=",
                      {
                        "Ref": "AWS::StackName"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export VPC=",
                      {
                        "Ref": "VPC"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export MongoDBVersion=",
                      {
                        "Ref": "MongoDBVersion"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",

                "./init.sh > install.log 2>&1 \n",
                "#  Cleanup \n",
                "#rm -rf *\n",
                "# All is well so signal success\n",
                "/opt/aws/bin/cfn-signal -e 0 -r \"MongoDB Config Server install success\" '",
                {
                  "Ref": "ConfigServer0WaitForNodeInstallWaitHandle"
                },
                "'\n"
              ]
            ]
          }
        },
        "InstanceType": {
          "Ref": "ConfigServerInstanceType"
        }
      },
      "Condition": "CreateMinOneShard"
    },
    "ConfigServer1NodeInterface": {
      "Type": "AWS::EC2::NetworkInterface",
      "Properties": {
        "Description": "Network Interface for Mongo Node",
        "SubnetId": {
          "Ref": "Secondary0NodeSubnet"
        },
        "GroupSet": [
          {
            "Ref": "ConfigServer1NodeSecurityGroup"
          }
        ],
        "SourceDestCheck": "true",
        "Tags": [
          {
            "Key": "Network",
            "Value": "Private"
          }
        ]
      },
      "Condition": "CreateMinOneShard"
    },
    "ConfigServer1NodeSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Enable external access and allow communication (Trim as needed)",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": "27030",
            "ToPort": "27030",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "22",
            "ToPort": "22",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "FromPort": "1",
            "ToPort": "65535"
          }
        ]
      },
      "Condition": "CreateMinOneShard"
    },
    "ConfigServer1NodeIAMRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "ec2.amazonaws.com"
                ]
              },
              "Action": [
                "sts:AssumeRole"
              ]
            }
          ]
        },
        "Path": "/",
        "Policies": [
          {
            "PolicyName": "Backup",
            "PolicyDocument": {
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:*",
                    "ec2:Describe*",
                    "ec2:AttachNetworkInterface",
                    "ec2:AttachVolume",
                    "ec2:CreateTags",
                    "ec2:CreateVolume",
                    "ec2:RunInstances",
                    "ec2:StartInstances",
                    "ec2:DeleteVolume",
                    "ec2:CreateSecurityGroup",
                    "ec2:CreateSnapshot"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:*",
                    "dynamodb:Scan",
                    "dynamodb:Query",
                    "dynamodb:GetItem",
                    "dynamodb:BatchGetItem",
                    "dynamodb:UpdateTable"
                  ],
                  "Resource": [
                    "*"
                  ]
                }
              ]
            }
          }
        ]
      },
      "Condition": "CreateMinOneShard"
    },
    "ConfigServer1NodeIAMProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Path": "/",
        "Roles": [
          {
            "Ref": "ConfigServer1NodeIAMRole"
          }
        ]
      },
      "Condition": "CreateMinOneShard"
    },
    "ConfigServer1WaitForNodeInstall": {
      "Type": "AWS::CloudFormation::WaitCondition",
      "DependsOn": "ConfigServer1NodeInstance",
      "Properties": {
        "Handle": {
          "Ref": "ConfigServer1WaitForNodeInstallWaitHandle"
        },
        "Timeout": "3600"
      },
      "Condition": "CreateMinOneShard"
    },
    "ConfigServer1WaitForNodeInstallWaitHandle": {
      "Type": "AWS::CloudFormation::WaitConditionHandle",
      "Properties": {},
      "Condition": "CreateMinOneShard"
    },
    "ConfigServer1NodeInstance": {
      "Type": "AWS::EC2::Instance",
      "Metadata": {
        "HostRole": "MongoDB Node"
      },
      "Properties": {
        "NetworkInterfaces": [
          {
            "NetworkInterfaceId": {
              "Ref": "ConfigServer1NodeInterface"
            },
            "DeviceIndex": "0"
          }
        ],
        "KeyName": {
          "Ref": "KeyName"
        },
        "ImageId": {
          "Fn::FindInMap": [
            "AMI",
            {
              "Ref": "AWS::Region"
            },
            {
              "Fn::FindInMap": [
                "InstanceTypeArch",
                {
                  "Ref": "NodeInstanceType"
                },
                "Arch"
              ]
            }
          ]
        },
        "IamInstanceProfile": {
          "Ref": "ConfigServer1NodeIAMProfile"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "ConfigServer1"
          },
          {
            "Key": "ClusterReplicaSetCount",
            "Value": {
              "Ref": "ClusterReplicaSetCount"
            }
          },
          {
            "Key": "ClusterShardCount",
            "Value": {
              "Ref": "ClusterShardCount"
            }
          },
          {
            "Key": "ConfigServerIndex",
            "Value": "1"
          }
        ],
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvdf",
            "Ebs": {
              "VolumeType": "gp2",
              "DeleteOnTermination": "true",
              "VolumeSize": "40"
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -v\n",
                "mkdir -p /home/ec2-user/mongodb \n",
                "cd /home/ec2-user/mongodb \n",
                "# Wait until the NAT initializes and Internet is available \n",
                "until ping -c 1 ietf.org \n",
                "do \n",
                "sleep 5; \n",
                "done \n",
                "##curl -OL https://s3-us-west-2.amazonaws.com/rh-public/orchestrator.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/orchestrator.sh orchestrator.sh\n",
                "chmod +x orchestrator.sh \n",
                "##curl -OL https://s3-us-west-2.amazonaws.com/rh-public/init.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/init.sh init.sh\n",
                "chmod +x init.sh \n",
                "#  Run the install \n",
                "#  Store stack name to tag DDB name\n",
                "echo ",
                {
                  "Fn::Join": [
                    "_",
                    [
                      "export TABLE_NAMETAG=",
                      {
                        "Ref": "AWS::StackName"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export VPC=",
                      {
                        "Ref": "VPC"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",

                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export MongoDBVersion=",
                      {
                        "Ref": "MongoDBVersion"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",

                "./init.sh > install.log 2>&1 \n",
                "#  Cleanup \n",
                "#rm -rf *\n",
                "# All is well so signal success\n",
                "/opt/aws/bin/cfn-signal -e 0 -r \"MongoDB Config Server install success\" '",
                {
                  "Ref": "ConfigServer1WaitForNodeInstallWaitHandle"
                },
                "'\n"
              ]
            ]
          }
        },
        "InstanceType": {
          "Ref": "ConfigServerInstanceType"
        }
      },
      "Condition": "CreateMinOneShard"
    },
    "ConfigServer2NodeInterface": {
      "Type": "AWS::EC2::NetworkInterface",
      "Properties": {
        "Description": "Network Interface for Mongo Node",
        "SubnetId": {
          "Ref": "Secondary1NodeSubnet"
        },
        "GroupSet": [
          {
            "Ref": "ConfigServer2NodeSecurityGroup"
          }
        ],
        "SourceDestCheck": "true",
        "Tags": [
          {
            "Key": "Network",
            "Value": "Private"
          }
        ]
      },
      "Condition": "CreateMinOneShard"
    },
    "ConfigServer2NodeSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Enable external access and allow communication (Trim as needed)",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": "27030",
            "ToPort": "27030",
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "22",
            "ToPort": "22",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "FromPort": "1",
            "ToPort": "65535"
          }
        ]
      },
      "Condition": "CreateMinOneShard"
    },
    "ConfigServer2NodeIAMRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "ec2.amazonaws.com"
                ]
              },
              "Action": [
                "sts:AssumeRole"
              ]
            }
          ]
        },
        "Path": "/",
        "Policies": [
          {
            "PolicyName": "Backup",
            "PolicyDocument": {
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:*",
                    "ec2:Describe*",
                    "ec2:AttachNetworkInterface",
                    "ec2:AttachVolume",
                    "ec2:CreateTags",
                    "ec2:CreateVolume",
                    "ec2:RunInstances",
                    "ec2:StartInstances",
                    "ec2:DeleteVolume",
                    "ec2:CreateSecurityGroup",
                    "ec2:CreateSnapshot"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:*",
                    "dynamodb:Scan",
                    "dynamodb:Query",
                    "dynamodb:GetItem",
                    "dynamodb:BatchGetItem",
                    "dynamodb:UpdateTable"
                  ],
                  "Resource": [
                    "*"
                  ]
                }
              ]
            }
          }
        ]
      },
      "Condition": "CreateMinOneShard"
    },
    "ConfigServer2NodeIAMProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Path": "/",
        "Roles": [
          {
            "Ref": "ConfigServer2NodeIAMRole"
          }
        ]
      },
      "Condition": "CreateMinOneShard"
    },
    "ConfigServer2WaitForNodeInstall": {
      "Type": "AWS::CloudFormation::WaitCondition",
      "DependsOn": "ConfigServer2NodeInstance",
      "Properties": {
        "Handle": {
          "Ref": "ConfigServer2WaitForNodeInstallWaitHandle"
        },
        "Timeout": "3600"
      },
      "Condition": "CreateMinOneShard"
    },
    "ConfigServer2WaitForNodeInstallWaitHandle": {
      "Type": "AWS::CloudFormation::WaitConditionHandle",
      "Properties": {},
      "Condition": "CreateMinOneShard"
    },
    "ConfigServer2NodeInstance": {
      "Type": "AWS::EC2::Instance",
      "Metadata": {
        "HostRole": "MongoDB Node"
      },
      "Properties": {
        "NetworkInterfaces": [
          {
            "NetworkInterfaceId": {
              "Ref": "ConfigServer2NodeInterface"
            },
            "DeviceIndex": "0"
          }
        ],
        "KeyName": {
          "Ref": "KeyName"
        },
        "ImageId": {
          "Fn::FindInMap": [
            "AMI",
            {
              "Ref": "AWS::Region"
            },
            {
              "Fn::FindInMap": [
                "InstanceTypeArch",
                {
                  "Ref": "NodeInstanceType"
                },
                "Arch"
              ]
            }
          ]
        },
        "IamInstanceProfile": {
          "Ref": "ConfigServer2NodeIAMProfile"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "ConfigServer2"
          },
          {
            "Key": "ClusterReplicaSetCount",
            "Value": {
              "Ref": "ClusterReplicaSetCount"
            }
          },
          {
            "Key": "ClusterShardCount",
            "Value": {
              "Ref": "ClusterShardCount"
            }
          },
          {
            "Key": "ConfigServerIndex",
            "Value": "2"
          }
        ],
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvdf",
            "Ebs": {
              "VolumeType": "gp2",
              "DeleteOnTermination": "true",
              "VolumeSize": "40"
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -v\n",
                "mkdir -p /home/ec2-user/mongodb \n",
                "cd /home/ec2-user/mongodb \n",
                "# Wait until the NAT initializes and Internet is available \n",
                "until ping -c 1 ietf.org \n",
                "do \n",
                "sleep 5; \n",
                "done \n",
                "##curl -OL https://s3-us-west-2.amazonaws.com/rh-public/orchestrator.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/orchestrator.sh orchestrator.sh\n",
                "chmod +x orchestrator.sh \n",
                "##curl -OL https://s3-us-west-2.amazonaws.com/rh-public/init.sh \n",
                "aws s3 cp s3://",
                {
                  "Ref": "BuildBucket"
                },
                "/scripts/init.sh init.sh\n",
                "chmod +x init.sh \n",
                "#  Run the install \n",
                "#  Store stack name to tag DDB name\n",
                "echo ",
                {
                  "Fn::Join": [
                    "_",
                    [
                      "export TABLE_NAMETAG=",
                      {
                        "Ref": "AWS::StackName"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export VPC=",
                      {
                        "Ref": "VPC"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",
                "echo ",
                {
                  "Fn::Join": [
                    "",
                    [
                      "export MongoDBVersion=",
                      {
                        "Ref": "MongoDBVersion"
                      }
                    ]
                  ]
                },
                " >> config.sh\n",


                "./init.sh > install.log 2>&1 \n",
                "#  Cleanup \n",
                "#rm -rf *\n",
                "# All is well so signal success\n",
                "/opt/aws/bin/cfn-signal -e 0 -r \"MongoDB Config Server install success\" '",
                {
                  "Ref": "ConfigServer2WaitForNodeInstallWaitHandle"
                },
                "'\n"
              ]
            ]
          }
        },
        "InstanceType": {
          "Ref": "ConfigServerInstanceType"
        }
      },
      "Condition": "CreateMinOneShard"
    }
  }
}
