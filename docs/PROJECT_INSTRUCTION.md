# QUADRUPED ROBOT PROJECT - DEVELOPMENT INSTRUCTIONS

## Project Overview

Design and develop a compact 8-DOF Quadruped Robot using:

* ESP32 Dev Board
* PCA9685 16-Channel Servo Driver
* 8 × MG90S Servo Motors (Legs)
* 1 × MG90S Servo Motor (Head Rotation)
* Custom 3D Printed Chassis and Legs
* FreeCAD for CAD Design
* Arduino IDE for Programming

---

# Mechanical Architecture

## Total Servos

| Function            | Quantity |
| ------------------- | -------- |
| Hip Servos          | 4        |
| Knee Servos         | 4        |
| Head Rotation Servo | 1        |
| Total               | 9        |

---

# Robot Structure

## Head Box

Contains:

* ESP32
* PCA9685
* Switch
* Future Sensor Mounts

Suggested Dimensions:

```text
Length = 85 mm
Width = 65 mm
Height = 45 mm
Wall Thickness = 2.5 mm
```

---

## Core Plate

Contains:

* Four Hip Servo Mounts
* One Center Head Servo Mount

Suggested Dimensions:

```text
Length = 110 mm
Width = 85 mm
Thickness = 4 mm
```

---

## Leg Dimensions

### Upper Leg

```text
Length = 45 mm
Thickness = 5 mm
Width = 10 mm
```

### Lower Leg

```text
Length = 55 mm
Thickness = 5 mm
Width = 10 mm
```

---

# Servo Placement Layout

Top View

```text
 -----------------------------------
|                                   |
| FL Hip          FR Hip            |
|                                   |
|                                   |
|          Head Servo              |
|                                   |
|                                   |
| RL Hip          RR Hip            |
|___________________________________|
```

Where:

FL = Front Left
FR = Front Right
RL = Rear Left
RR = Rear Right

---

# Electronics Architecture

## Components

Required:

* ESP32 Dev Board
* PCA9685 Servo Driver
* 9 Servo Motors
* 5V Power Supply

Optional:

* Ultrasonic Sensor
* IMU Sensor
* Camera Module

---

# ESP32 to PCA9685 Connections

| ESP32 Pin | PCA9685 Pin |
| --------- | ----------- |
| 3.3V      | VCC         |
| GND       | GND         |
| GPIO21    | SDA         |
| GPIO22    | SCL         |

---

# Servo Power

Important:

PCA9685 does NOT generate servo voltage.

The servo rail (V+) must receive an external 5V supply.

| Power Source | PCA9685 |
| ------------ | ------- |
| +5V          | V+      |
| GND          | GND     |

---

# Servo Channel Mapping

| Channel | Servo            |
| ------- | ---------------- |
| CH0     | Front Left Hip   |
| CH1     | Front Left Knee  |
| CH2     | Front Right Hip  |
| CH3     | Front Right Knee |
| CH4     | Rear Left Hip    |
| CH5     | Rear Left Knee   |
| CH6     | Rear Right Hip   |
| CH7     | Rear Right Knee  |
| CH8     | Head Rotation    |

---

# Important Discovery During Testing

Problem encountered:

```text
Servo not moving through PCA9685.
```

Diagnosis:

```text
I2C Scanner detected PCA9685 at address 0x40.
```

Meaning:

* ESP32 working
* I2C working
* PCA9685 working

Root Cause:

```text
PCA9685 V+ rail measured only 0.10V.
```

Reason:

```text
V+ was not connected to a 5V source.
```

Resolution:

```text
Provide 5V directly to PCA9685 V+ terminal.
```

Expected Voltage:

```text
V+ = 4.8V to 5.2V
```

---

# Servo Direct Testing Procedure

Before using PCA9685, each servo should be tested directly.

## Wiring

| Servo Wire             | ESP32    |
| ---------------------- | -------- |
| Signal (Orange/Yellow) | GPIO18   |
| VCC (Red)              | VIN (5V) |
| GND (Brown/Black)      | GND      |

---

# Servo Test Code

```cpp
#include <ESP32Servo.h>

Servo myServo;

void setup()
{
  myServo.attach(18);
}

void loop()
{
  myServo.write(0);
  delay(1000);

  myServo.write(90);
  delay(1000);

  myServo.write(180);
  delay(1000);
}
```

---

# PCA9685 I2C Scanner

Used to verify communication.

Expected Output:

```text
I2C device found at 0x40
```

This confirms:

* SDA working
* SCL working
* PCA9685 responding

---

# FreeCAD Design Workflow

## Bodies

Create separate bodies:

```text
CorePlate
HeadBox
UpperLeg
LowerLeg
ServoMount
Assembly
```

---

## Design Order

1. Core Plate
2. Head Servo Mount
3. Hip Servo Mounts
4. Upper Leg
5. Lower Leg
6. Head Box
7. Assembly

---

# Printing Recommendations

Material:

```text
PLA+
```

or

```text
PETG
```

Settings:

```text
Layer Height = 0.2 mm
Infill = 40%
Walls = 4
Nozzle = 0.4 mm
```

---

# Development Roadmap

Phase 1

* Test all servos individually
* Verify ESP32
* Verify PCA9685

Phase 2

* Design CAD Parts
* Print Prototype

Phase 3

* Assemble Robot

Phase 4

* Servo Calibration

Phase 5

* Standing Pose

Phase 6

* Walking Gait

Phase 7

* Turning Gait

Phase 8

* Sensor Integration

Phase 9

* Autonomous Navigation

---

# Current Status

Completed:

* Quadruped concept finalized
* Mechanical dimensions estimated
* Servo channel mapping defined
* ESP32-PCA9685 communication verified
* PCA9685 address confirmed (0x40)
* Root cause of servo issue identified (V+ power rail)

Next Task:

```text
Test all 9 servos individually.
Then begin FreeCAD modeling of the chassis and legs.
```
