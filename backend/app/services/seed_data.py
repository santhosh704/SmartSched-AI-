"""
SmartSched AI - Complete Seed Data Generator
Generates all demo data with Indian manufacturing context
"""
import json
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.models import (
    User, Product, Routing, Machine, Operator, Skill, Tool,
    Material, MaintenanceWindow, ChangeoverMatrix, Order, AuditLog
)
from app.core.security import get_password_hash

random.seed(42)

BASE_DATE = datetime(2026, 9, 3, 6, 0, 0)  # Schedule base: today

def seed_users(db: Session):
    users = [
        {"username": "admin", "email": "admin@smartsched.in", "password": "admin123", "role": "admin", "full_name": "Rajesh Kumar (Admin)"},
        {"username": "prod_manager", "email": "prodmgr@smartsched.in", "password": "manager123", "role": "production_manager", "full_name": "Sunita Sharma"},
        {"username": "planner", "email": "planner@smartsched.in", "password": "planner123", "role": "planner", "full_name": "Anil Verma"},
        {"username": "operator1", "email": "op1@smartsched.in", "password": "operator123", "role": "operator", "full_name": "Ramesh Yadav"},
        {"username": "auditor", "email": "auditor@smartsched.in", "password": "auditor123", "role": "auditor", "full_name": "Priya Nair"},
    ]
    for u in users:
        if not db.query(User).filter(User.username == u["username"]).first():
            user = User(
                username=u["username"], email=u["email"],
                hashed_password=get_password_hash(u["password"]),
                role=u["role"], full_name=u["full_name"], is_active=True
            )
            db.add(user)
    db.commit()

def seed_skills(db: Session):
    skills_data = [
        {"skill_id": "SK01", "skill_name": "PCB Assembly", "description": "Printed circuit board component placement and assembly", "level_required": 2},
        {"skill_id": "SK02", "skill_name": "Soldering", "description": "Precision soldering of electronic components", "level_required": 2},
        {"skill_id": "SK03", "skill_name": "Wiring", "description": "Panel wiring, cable routing, and termination", "level_required": 2},
        {"skill_id": "SK04", "skill_name": "Electrical Testing", "description": "Functional and electrical safety testing", "level_required": 3},
        {"skill_id": "SK05", "skill_name": "Quality Inspection", "description": "Visual and measurement-based quality control", "level_required": 2},
        {"skill_id": "SK06", "skill_name": "CNC Operation", "description": "CNC machine programming and operation", "level_required": 3},
        {"skill_id": "SK07", "skill_name": "Final Assembly", "description": "Enclosure assembly and mechanical fitting", "level_required": 1},
    ]
    for s in skills_data:
        if not db.query(Skill).filter(Skill.skill_id == s["skill_id"]).first():
            db.add(Skill(**s))
    db.commit()

def seed_machines(db: Session):
    machines_data = [
        {
            "machine_id": "M01", "machine_name": "PCB Assembly Station Alpha",
            "work_center": "PCB Assembly",
            "eligible_operations": json.dumps(["Component Preparation", "PCB Assembly", "Soldering"]),
            "capacity": 1, "status": "active", "energy_rate_kwh": 1.5,
            "description": "Automated SMT pick-and-place with reflow oven"
        },
        {
            "machine_id": "M02", "machine_name": "Wiring Station Beta",
            "work_center": "Wiring",
            "eligible_operations": json.dumps(["Wiring", "Cable Routing", "Terminal Assembly"]),
            "capacity": 1, "status": "active", "energy_rate_kwh": 0.8,
            "description": "Panel wiring workbench with DIN rail fixtures"
        },
        {
            "machine_id": "M03", "machine_name": "Enclosure Assembly Rig",
            "work_center": "Mechanical Assembly",
            "eligible_operations": json.dumps(["Enclosure Assembly", "Final Assembly", "Mechanical Fitting"]),
            "capacity": 1, "status": "active", "energy_rate_kwh": 0.5,
            "description": "Torque-controlled assembly workstation"
        },
        {
            "machine_id": "M04", "machine_name": "Test Bench Alpha",
            "work_center": "Testing",
            "eligible_operations": json.dumps(["Functional Testing", "Electrical Testing", "Programming"]),
            "capacity": 1, "status": "active", "energy_rate_kwh": 2.2,
            "description": "High-voltage electrical safety and functional test bench"
        },
        {
            "machine_id": "M05", "machine_name": "Test Bench Beta",
            "work_center": "Testing",
            "eligible_operations": json.dumps(["Functional Testing", "Electrical Testing", "Calibration"]),
            "capacity": 1, "status": "active", "energy_rate_kwh": 2.0,
            "description": "Secondary test bench for parallel testing"
        },
        {
            "machine_id": "M06", "machine_name": "Quality Control Station",
            "work_center": "Quality Control",
            "eligible_operations": json.dumps(["Quality Inspection", "Packing", "Documentation"]),
            "capacity": 1, "status": "active", "energy_rate_kwh": 0.3,
            "description": "QC inspection table with measurement instruments"
        },
    ]
    for m in machines_data:
        if not db.query(Machine).filter(Machine.machine_id == m["machine_id"]).first():
            db.add(Machine(**m))
    db.commit()

def seed_operators(db: Session):
    operators_data = [
        {"operator_id": "OP01", "operator_name": "Ravi Shankar", "shift": "morning",
         "skills": json.dumps({"PCB Assembly": 3, "Soldering": 3, "Electrical Testing": 2}),
         "overtime_limit_hours": 2.0, "cost_per_hour": 180.0},
        {"operator_id": "OP02", "operator_name": "Meena Kumari", "shift": "morning",
         "skills": json.dumps({"PCB Assembly": 2, "Soldering": 2, "Quality Inspection": 3}),
         "overtime_limit_hours": 1.5, "cost_per_hour": 160.0},
        {"operator_id": "OP03", "operator_name": "Suresh Babu", "shift": "morning",
         "skills": json.dumps({"Wiring": 3, "Electrical Testing": 3, "Final Assembly": 2}),
         "overtime_limit_hours": 2.0, "cost_per_hour": 175.0},
        {"operator_id": "OP04", "operator_name": "Kavitha Reddy", "shift": "morning",
         "skills": json.dumps({"Wiring": 2, "Electrical Testing": 2, "Quality Inspection": 2}),
         "overtime_limit_hours": 1.0, "cost_per_hour": 155.0},
        {"operator_id": "OP05", "operator_name": "Arjun Patel", "shift": "morning",
         "skills": json.dumps({"Final Assembly": 3, "Quality Inspection": 3, "Wiring": 1}),
         "overtime_limit_hours": 2.0, "cost_per_hour": 170.0},
        {"operator_id": "OP06", "operator_name": "Lakshmi Devi", "shift": "evening",
         "skills": json.dumps({"PCB Assembly": 3, "Soldering": 3, "CNC Operation": 2}),
         "overtime_limit_hours": 2.0, "cost_per_hour": 180.0},
        {"operator_id": "OP07", "operator_name": "Vijay Kumar", "shift": "evening",
         "skills": json.dumps({"Wiring": 3, "Electrical Testing": 3, "Final Assembly": 3}),
         "overtime_limit_hours": 2.5, "cost_per_hour": 185.0},
        {"operator_id": "OP08", "operator_name": "Saritha Nair", "shift": "evening",
         "skills": json.dumps({"Quality Inspection": 3, "Electrical Testing": 2, "Final Assembly": 2}),
         "overtime_limit_hours": 1.5, "cost_per_hour": 165.0},
        {"operator_id": "OP09", "operator_name": "Mohan Das", "shift": "evening",
         "skills": json.dumps({"Soldering": 3, "PCB Assembly": 2, "Wiring": 2}),
         "overtime_limit_hours": 2.0, "cost_per_hour": 170.0},
        {"operator_id": "OP10", "operator_name": "Anita Singh", "shift": "morning",
         "skills": json.dumps({"CNC Operation": 3, "Final Assembly": 2, "Quality Inspection": 2}),
         "overtime_limit_hours": 1.5, "cost_per_hour": 190.0},
    ]
    for op in operators_data:
        if not db.query(Operator).filter(Operator.operator_id == op["operator_id"]).first():
            db.add(Operator(**op))
    db.commit()

def seed_tools(db: Session):
    tools_data = [
        {"tool_id": "T01", "tool_name": "Torque Driver Set", "tool_type": "Hand Tool", "total_quantity": 2, "available_quantity": 2, "description": "Calibrated torque drivers 0.5-5 Nm"},
        {"tool_id": "T02", "tool_name": "Soldering Station", "tool_type": "Electronic Tool", "total_quantity": 3, "available_quantity": 3, "description": "Temperature-controlled soldering iron 150-450°C"},
        {"tool_id": "T03", "tool_name": "Digital Multimeter", "tool_type": "Measurement", "total_quantity": 4, "available_quantity": 4, "description": "True RMS digital multimeter Fluke 117"},
        {"tool_id": "T04", "tool_name": "Crimping Tool", "tool_type": "Hand Tool", "total_quantity": 3, "available_quantity": 3, "description": "Ratchet crimping tool for wire terminals"},
        {"tool_id": "T05", "tool_name": "Programming Interface", "tool_type": "Electronic Tool", "total_quantity": 2, "available_quantity": 2, "description": "USB programmer for PLC/microcontroller firmware"},
        {"tool_id": "T06", "tool_name": "Functional Test Kit", "tool_type": "Test Equipment", "total_quantity": 2, "available_quantity": 2, "description": "Custom functional test fixture with load bank"},
        {"tool_id": "T07", "tool_name": "Wire Stripper", "tool_type": "Hand Tool", "total_quantity": 4, "available_quantity": 4, "description": "Automatic wire stripper 0.2-6mm²"},
        {"tool_id": "T08", "tool_name": "Label Printer", "tool_type": "Office Equipment", "total_quantity": 2, "available_quantity": 2, "description": "Industrial label printer Brady BMP21"},
    ]
    for t in tools_data:
        if not db.query(Tool).filter(Tool.tool_id == t["tool_id"]).first():
            db.add(Tool(**t))
    db.commit()

def seed_materials(db: Session):
    materials_data = [
        {"material_id": "MAT01", "material_name": "PCB Blank Board (CTRL-A/B/C)", "stock_quantity": 150.0, "unit": "pcs", "reorder_level": 30.0, "lead_time_days": 7, "supplier": "Ajanta Circuits Pvt Ltd", "cost_per_unit": 250.0},
        {"material_id": "MAT02", "material_name": "Copper Terminal CT-12 (6mm²)", "stock_quantity": 800.0, "unit": "pcs", "reorder_level": 200.0, "lead_time_days": 5, "supplier": "Phoenix Contact India", "cost_per_unit": 45.0},
        {"material_id": "MAT03", "material_name": "DIN Rail 35mm (1m)", "stock_quantity": 80.0, "unit": "pcs", "reorder_level": 20.0, "lead_time_days": 3, "supplier": "Rittal India Pvt Ltd", "cost_per_unit": 120.0},
        {"material_id": "MAT04", "material_name": "STM32 Microcontroller Module", "stock_quantity": 120.0, "unit": "pcs", "reorder_level": 25.0, "lead_time_days": 14, "supplier": "Mouser Electronics India", "cost_per_unit": 850.0},
        {"material_id": "MAT05", "material_name": "Solder Wire Sn60Pb40 (500g)", "stock_quantity": 45.0, "unit": "rolls", "reorder_level": 10.0, "lead_time_days": 3, "supplier": "Indium Corporation India", "cost_per_unit": 380.0},
        {"material_id": "MAT06", "material_name": "Cable Duct 25x25mm (2m)", "stock_quantity": 200.0, "unit": "pcs", "reorder_level": 50.0, "lead_time_days": 5, "supplier": "Legrand India Pvt Ltd", "cost_per_unit": 85.0},
        {"material_id": "MAT07", "material_name": "Enclosure GRP 400x300x200mm", "stock_quantity": 60.0, "unit": "pcs", "reorder_level": 15.0, "lead_time_days": 10, "supplier": "Fibox Enclosures India", "cost_per_unit": 2200.0},
        {"material_id": "MAT08", "material_name": "24VDC SMPS 5A", "stock_quantity": 90.0, "unit": "pcs", "reorder_level": 20.0, "lead_time_days": 7, "supplier": "Mean Well India", "cost_per_unit": 1200.0},
        {"material_id": "MAT09", "material_name": "3-Phase MCB 16A C-Curve", "stock_quantity": 200.0, "unit": "pcs", "reorder_level": 40.0, "lead_time_days": 5, "supplier": "ABB India Ltd", "cost_per_unit": 450.0},
        {"material_id": "MAT10", "material_name": "Ferrule End Sleeve 1.5mm² (100pcs pack)", "stock_quantity": 500.0, "unit": "pcs", "reorder_level": 100.0, "lead_time_days": 3, "supplier": "Weidmuller India", "cost_per_unit": 8.0},
        {"material_id": "MAT11", "material_name": "Temperature Sensor PT100", "stock_quantity": 75.0, "unit": "pcs", "reorder_level": 15.0, "lead_time_days": 10, "supplier": "WIKA India Pvt Ltd", "cost_per_unit": 650.0},
        {"material_id": "MAT12", "material_name": "RS-485 Communication Module", "stock_quantity": 55.0, "unit": "pcs", "reorder_level": 12.0, "lead_time_days": 12, "supplier": "Advantech India", "cost_per_unit": 950.0},
        {"material_id": "MAT13", "material_name": "Flexible Wire 1.5mm² Multi-strand (100m roll)", "stock_quantity": 35.0, "unit": "rolls", "reorder_level": 8.0, "lead_time_days": 5, "supplier": "Polycab India Ltd", "cost_per_unit": 1800.0},
        {"material_id": "MAT14", "material_name": "OLED Display 128x64 Module", "stock_quantity": 40.0, "unit": "pcs", "reorder_level": 10.0, "lead_time_days": 14, "supplier": "Mouser Electronics India", "cost_per_unit": 280.0},
        {"material_id": "MAT15", "material_name": "Packing Foam Insert (customizable)", "stock_quantity": 300.0, "unit": "pcs", "reorder_level": 60.0, "lead_time_days": 4, "supplier": "Sealed Air India", "cost_per_unit": 35.0},
        {"material_id": "MAT16", "material_name": "Corrugated Shipping Box 500x400x350mm", "stock_quantity": 250.0, "unit": "pcs", "reorder_level": 50.0, "lead_time_days": 3, "supplier": "Smurfit Kappa India", "cost_per_unit": 45.0},
        {"material_id": "MAT17", "material_name": "IoT Gateway Module ESP32", "stock_quantity": 65.0, "unit": "pcs", "reorder_level": 15.0, "lead_time_days": 10, "supplier": "Espressif India Partner", "cost_per_unit": 420.0},
        {"material_id": "MAT18", "material_name": "4-20mA Current Sensor Module", "stock_quantity": 45.0, "unit": "pcs", "reorder_level": 10.0, "lead_time_days": 12, "supplier": "Yokogawa India Ltd", "cost_per_unit": 1100.0},
    ]
    for m in materials_data:
        if not db.query(Material).filter(Material.material_id == m["material_id"]).first():
            db.add(Material(**m))
    db.commit()

def seed_products_and_routings(db: Session):
    products_data = [
        {"product_id": "CTRL-A", "product_name": "Motor Control Panel - Standard", "variant": "Standard", "batch_size": 5, "standard_cost": 18500.0, "energy_factor": 1.2, "description": "3-phase motor starter panel with DOL starter, MCB protection"},
        {"product_id": "CTRL-B", "product_name": "Motor Control Panel - Advanced", "variant": "Advanced", "batch_size": 3, "standard_cost": 28000.0, "energy_factor": 1.5, "description": "3-phase VFD control panel with PLC, HMI, and remote monitoring"},
        {"product_id": "CTRL-C", "product_name": "Motor Control Panel - Compact", "variant": "Compact", "batch_size": 8, "standard_cost": 12500.0, "energy_factor": 0.9, "description": "Compact single-phase motor starter panel"},
        {"product_id": "SENSOR-A", "product_name": "Industrial IoT Sensor Node - Temperature", "variant": "Temperature", "batch_size": 10, "standard_cost": 3500.0, "energy_factor": 0.4, "description": "PT100/thermocouple temperature monitoring node with RS-485/Modbus"},
        {"product_id": "SENSOR-B", "product_name": "Industrial IoT Sensor Node - Multi-Parameter", "variant": "Multi-Parameter", "batch_size": 8, "standard_cost": 5800.0, "energy_factor": 0.6, "description": "Multi-parameter sensor node (temp, pressure, vibration) with IoT gateway"},
        {"product_id": "PANEL-A", "product_name": "Power Distribution Panel - 63A", "variant": "63A", "batch_size": 4, "standard_cost": 35000.0, "energy_factor": 1.8, "description": "Main LV power distribution panel 63A with busbar, MCBs, earth leakage"},
        {"product_id": "PANEL-B", "product_name": "Power Distribution Panel - 100A", "variant": "100A", "batch_size": 2, "standard_cost": 52000.0, "energy_factor": 2.2, "description": "Heavy duty distribution panel 100A with metering and SCADA interface"},
        {"product_id": "PANEL-C", "product_name": "Relay Logic Control Panel", "variant": "Relay Logic", "batch_size": 6, "standard_cost": 22000.0, "energy_factor": 1.1, "description": "Relay-based interlock control panel for industrial machinery"},
    ]
    for p in products_data:
        if not db.query(Product).filter(Product.product_id == p["product_id"]).first():
            db.add(Product(**p))
    db.commit()

    # Routings: 4-7 operations per product
    routings_data = [
        # CTRL-A: Standard Motor Control Panel (5 operations)
        {"product_id": "CTRL-A", "operation_id": "CTRL-A-OP01", "operation_name": "Component Preparation", "sequence": 1, "duration_minutes": 45,
         "required_machine_types": json.dumps(["M01", "M03"]), "required_skills": json.dumps(["PCB Assembly"]),
         "required_tools": json.dumps(["T03"]), "required_materials": json.dumps({"MAT01": 1, "MAT09": 3, "MAT10": 20}), "setup_family": "SF_CTRL"},
        {"product_id": "CTRL-A", "operation_id": "CTRL-A-OP02", "operation_name": "PCB Assembly", "sequence": 2, "duration_minutes": 90,
         "required_machine_types": json.dumps(["M01"]), "required_skills": json.dumps(["PCB Assembly", "Soldering"]),
         "required_tools": json.dumps(["T02", "T03"]), "required_materials": json.dumps({"MAT04": 1, "MAT05": 1}), "setup_family": "SF_PCB"},
        {"product_id": "CTRL-A", "operation_id": "CTRL-A-OP03", "operation_name": "Wiring", "sequence": 3, "duration_minutes": 120,
         "required_machine_types": json.dumps(["M02"]), "required_skills": json.dumps(["Wiring"]),
         "required_tools": json.dumps(["T04", "T07"]), "required_materials": json.dumps({"MAT02": 15, "MAT06": 2, "MAT13": 1}), "setup_family": "SF_WIRE"},
        {"product_id": "CTRL-A", "operation_id": "CTRL-A-OP04", "operation_name": "Enclosure Assembly", "sequence": 4, "duration_minutes": 60,
         "required_machine_types": json.dumps(["M03"]), "required_skills": json.dumps(["Final Assembly"]),
         "required_tools": json.dumps(["T01"]), "required_materials": json.dumps({"MAT03": 1, "MAT07": 1}), "setup_family": "SF_ENCL"},
        {"product_id": "CTRL-A", "operation_id": "CTRL-A-OP05", "operation_name": "Functional Testing", "sequence": 5, "duration_minutes": 75,
         "required_machine_types": json.dumps(["M04", "M05"]), "required_skills": json.dumps(["Electrical Testing"]),
         "required_tools": json.dumps(["T03", "T06"]), "required_materials": json.dumps({}), "setup_family": "SF_TEST"},
        {"product_id": "CTRL-A", "operation_id": "CTRL-A-OP06", "operation_name": "Quality Inspection", "sequence": 6, "duration_minutes": 30,
         "required_machine_types": json.dumps(["M06"]), "required_skills": json.dumps(["Quality Inspection"]),
         "required_tools": json.dumps(["T03", "T08"]), "required_materials": json.dumps({}), "setup_family": "SF_QC"},

        # CTRL-B: Advanced Motor Control Panel (7 operations)
        {"product_id": "CTRL-B", "operation_id": "CTRL-B-OP01", "operation_name": "Component Preparation", "sequence": 1, "duration_minutes": 60,
         "required_machine_types": json.dumps(["M01", "M03"]), "required_skills": json.dumps(["PCB Assembly"]),
         "required_tools": json.dumps(["T03"]), "required_materials": json.dumps({"MAT01": 2, "MAT08": 1, "MAT09": 6, "MAT10": 30}), "setup_family": "SF_CTRL"},
        {"product_id": "CTRL-B", "operation_id": "CTRL-B-OP02", "operation_name": "PCB Assembly", "sequence": 2, "duration_minutes": 120,
         "required_machine_types": json.dumps(["M01"]), "required_skills": json.dumps(["PCB Assembly", "Soldering"]),
         "required_tools": json.dumps(["T02", "T03"]), "required_materials": json.dumps({"MAT04": 2, "MAT05": 1, "MAT12": 1}), "setup_family": "SF_PCB"},
        {"product_id": "CTRL-B", "operation_id": "CTRL-B-OP03", "operation_name": "Wiring", "sequence": 3, "duration_minutes": 150,
         "required_machine_types": json.dumps(["M02"]), "required_skills": json.dumps(["Wiring"]),
         "required_tools": json.dumps(["T04", "T07"]), "required_materials": json.dumps({"MAT02": 25, "MAT06": 4, "MAT13": 2}), "setup_family": "SF_WIRE"},
        {"product_id": "CTRL-B", "operation_id": "CTRL-B-OP04", "operation_name": "Enclosure Assembly", "sequence": 4, "duration_minutes": 90,
         "required_machine_types": json.dumps(["M03"]), "required_skills": json.dumps(["Final Assembly"]),
         "required_tools": json.dumps(["T01"]), "required_materials": json.dumps({"MAT03": 2, "MAT07": 1}), "setup_family": "SF_ENCL"},
        {"product_id": "CTRL-B", "operation_id": "CTRL-B-OP05", "operation_name": "Programming", "sequence": 5, "duration_minutes": 60,
         "required_machine_types": json.dumps(["M04", "M05"]), "required_skills": json.dumps(["Electrical Testing"]),
         "required_tools": json.dumps(["T05"]), "required_materials": json.dumps({"MAT14": 1}), "setup_family": "SF_PROG"},
        {"product_id": "CTRL-B", "operation_id": "CTRL-B-OP06", "operation_name": "Functional Testing", "sequence": 6, "duration_minutes": 90,
         "required_machine_types": json.dumps(["M04", "M05"]), "required_skills": json.dumps(["Electrical Testing"]),
         "required_tools": json.dumps(["T03", "T06"]), "required_materials": json.dumps({}), "setup_family": "SF_TEST"},
        {"product_id": "CTRL-B", "operation_id": "CTRL-B-OP07", "operation_name": "Quality Inspection", "sequence": 7, "duration_minutes": 45,
         "required_machine_types": json.dumps(["M06"]), "required_skills": json.dumps(["Quality Inspection"]),
         "required_tools": json.dumps(["T03", "T08"]), "required_materials": json.dumps({}), "setup_family": "SF_QC"},

        # CTRL-C: Compact Motor Control Panel (4 operations)
        {"product_id": "CTRL-C", "operation_id": "CTRL-C-OP01", "operation_name": "Component Preparation", "sequence": 1, "duration_minutes": 30,
         "required_machine_types": json.dumps(["M01", "M03"]), "required_skills": json.dumps(["PCB Assembly"]),
         "required_tools": json.dumps(["T03"]), "required_materials": json.dumps({"MAT01": 1, "MAT09": 1, "MAT10": 10}), "setup_family": "SF_CTRL"},
        {"product_id": "CTRL-C", "operation_id": "CTRL-C-OP02", "operation_name": "Wiring", "sequence": 2, "duration_minutes": 60,
         "required_machine_types": json.dumps(["M02"]), "required_skills": json.dumps(["Wiring"]),
         "required_tools": json.dumps(["T04", "T07"]), "required_materials": json.dumps({"MAT02": 8, "MAT06": 1, "MAT13": 1}), "setup_family": "SF_WIRE"},
        {"product_id": "CTRL-C", "operation_id": "CTRL-C-OP03", "operation_name": "Enclosure Assembly", "sequence": 3, "duration_minutes": 45,
         "required_machine_types": json.dumps(["M03"]), "required_skills": json.dumps(["Final Assembly"]),
         "required_tools": json.dumps(["T01"]), "required_materials": json.dumps({"MAT07": 1}), "setup_family": "SF_ENCL"},
        {"product_id": "CTRL-C", "operation_id": "CTRL-C-OP04", "operation_name": "Functional Testing", "sequence": 4, "duration_minutes": 45,
         "required_machine_types": json.dumps(["M04", "M05"]), "required_skills": json.dumps(["Electrical Testing"]),
         "required_tools": json.dumps(["T03", "T06"]), "required_materials": json.dumps({}), "setup_family": "SF_TEST"},

        # SENSOR-A: Temperature Sensor Node (5 operations)
        {"product_id": "SENSOR-A", "operation_id": "SENSOR-A-OP01", "operation_name": "Component Preparation", "sequence": 1, "duration_minutes": 20,
         "required_machine_types": json.dumps(["M01"]), "required_skills": json.dumps(["PCB Assembly"]),
         "required_tools": json.dumps(["T03"]), "required_materials": json.dumps({"MAT04": 1, "MAT11": 1, "MAT10": 5}), "setup_family": "SF_SENSOR"},
        {"product_id": "SENSOR-A", "operation_id": "SENSOR-A-OP02", "operation_name": "PCB Assembly", "sequence": 2, "duration_minutes": 50,
         "required_machine_types": json.dumps(["M01"]), "required_skills": json.dumps(["PCB Assembly", "Soldering"]),
         "required_tools": json.dumps(["T02", "T03"]), "required_materials": json.dumps({"MAT05": 1}), "setup_family": "SF_PCB"},
        {"product_id": "SENSOR-A", "operation_id": "SENSOR-A-OP03", "operation_name": "Enclosure Assembly", "sequence": 3, "duration_minutes": 25,
         "required_machine_types": json.dumps(["M03"]), "required_skills": json.dumps(["Final Assembly"]),
         "required_tools": json.dumps(["T01"]), "required_materials": json.dumps({"MAT07": 1}), "setup_family": "SF_ENCL"},
        {"product_id": "SENSOR-A", "operation_id": "SENSOR-A-OP04", "operation_name": "Calibration", "sequence": 4, "duration_minutes": 40,
         "required_machine_types": json.dumps(["M04", "M05"]), "required_skills": json.dumps(["Electrical Testing"]),
         "required_tools": json.dumps(["T03", "T06"]), "required_materials": json.dumps({}), "setup_family": "SF_CAL"},
        {"product_id": "SENSOR-A", "operation_id": "SENSOR-A-OP05", "operation_name": "Quality Inspection", "sequence": 5, "duration_minutes": 20,
         "required_machine_types": json.dumps(["M06"]), "required_skills": json.dumps(["Quality Inspection"]),
         "required_tools": json.dumps(["T08"]), "required_materials": json.dumps({"MAT15": 1, "MAT16": 1}), "setup_family": "SF_QC"},

        # SENSOR-B: Multi-Parameter Sensor (6 operations)
        {"product_id": "SENSOR-B", "operation_id": "SENSOR-B-OP01", "operation_name": "Component Preparation", "sequence": 1, "duration_minutes": 30,
         "required_machine_types": json.dumps(["M01"]), "required_skills": json.dumps(["PCB Assembly"]),
         "required_tools": json.dumps(["T03"]), "required_materials": json.dumps({"MAT04": 1, "MAT11": 1, "MAT17": 1, "MAT18": 1}), "setup_family": "SF_SENSOR"},
        {"product_id": "SENSOR-B", "operation_id": "SENSOR-B-OP02", "operation_name": "PCB Assembly", "sequence": 2, "duration_minutes": 75,
         "required_machine_types": json.dumps(["M01"]), "required_skills": json.dumps(["PCB Assembly", "Soldering"]),
         "required_tools": json.dumps(["T02", "T03"]), "required_materials": json.dumps({"MAT05": 1, "MAT12": 1}), "setup_family": "SF_PCB"},
        {"product_id": "SENSOR-B", "operation_id": "SENSOR-B-OP03", "operation_name": "Wiring", "sequence": 3, "duration_minutes": 45,
         "required_machine_types": json.dumps(["M02"]), "required_skills": json.dumps(["Wiring"]),
         "required_tools": json.dumps(["T04", "T07"]), "required_materials": json.dumps({"MAT13": 1, "MAT02": 5}), "setup_family": "SF_WIRE"},
        {"product_id": "SENSOR-B", "operation_id": "SENSOR-B-OP04", "operation_name": "Enclosure Assembly", "sequence": 4, "duration_minutes": 35,
         "required_machine_types": json.dumps(["M03"]), "required_skills": json.dumps(["Final Assembly"]),
         "required_tools": json.dumps(["T01"]), "required_materials": json.dumps({"MAT07": 1}), "setup_family": "SF_ENCL"},
        {"product_id": "SENSOR-B", "operation_id": "SENSOR-B-OP05", "operation_name": "Calibration & Testing", "sequence": 5, "duration_minutes": 60,
         "required_machine_types": json.dumps(["M04", "M05"]), "required_skills": json.dumps(["Electrical Testing"]),
         "required_tools": json.dumps(["T03", "T05", "T06"]), "required_materials": json.dumps({}), "setup_family": "SF_CAL"},
        {"product_id": "SENSOR-B", "operation_id": "SENSOR-B-OP06", "operation_name": "Quality Inspection", "sequence": 6, "duration_minutes": 25,
         "required_machine_types": json.dumps(["M06"]), "required_skills": json.dumps(["Quality Inspection"]),
         "required_tools": json.dumps(["T08"]), "required_materials": json.dumps({"MAT15": 1, "MAT16": 1}), "setup_family": "SF_QC"},

        # PANEL-A: 63A Distribution Panel (6 operations)
        {"product_id": "PANEL-A", "operation_id": "PANEL-A-OP01", "operation_name": "Component Preparation", "sequence": 1, "duration_minutes": 90,
         "required_machine_types": json.dumps(["M03"]), "required_skills": json.dumps(["Final Assembly"]),
         "required_tools": json.dumps(["T01", "T03"]), "required_materials": json.dumps({"MAT03": 3, "MAT09": 12, "MAT10": 60}), "setup_family": "SF_PANEL"},
        {"product_id": "PANEL-A", "operation_id": "PANEL-A-OP02", "operation_name": "Busbar Installation", "sequence": 2, "duration_minutes": 60,
         "required_machine_types": json.dumps(["M03"]), "required_skills": json.dumps(["Wiring", "Final Assembly"]),
         "required_tools": json.dumps(["T01", "T04"]), "required_materials": json.dumps({"MAT02": 40, "MAT06": 4}), "setup_family": "SF_PANEL"},
        {"product_id": "PANEL-A", "operation_id": "PANEL-A-OP03", "operation_name": "Wiring", "sequence": 3, "duration_minutes": 180,
         "required_machine_types": json.dumps(["M02"]), "required_skills": json.dumps(["Wiring"]),
         "required_tools": json.dumps(["T04", "T07"]), "required_materials": json.dumps({"MAT02": 30, "MAT13": 3}), "setup_family": "SF_WIRE"},
        {"product_id": "PANEL-A", "operation_id": "PANEL-A-OP04", "operation_name": "Enclosure Assembly", "sequence": 4, "duration_minutes": 75,
         "required_machine_types": json.dumps(["M03"]), "required_skills": json.dumps(["Final Assembly"]),
         "required_tools": json.dumps(["T01"]), "required_materials": json.dumps({"MAT07": 1}), "setup_family": "SF_ENCL"},
        {"product_id": "PANEL-A", "operation_id": "PANEL-A-OP05", "operation_name": "Functional Testing", "sequence": 5, "duration_minutes": 90,
         "required_machine_types": json.dumps(["M04", "M05"]), "required_skills": json.dumps(["Electrical Testing"]),
         "required_tools": json.dumps(["T03", "T06"]), "required_materials": json.dumps({}), "setup_family": "SF_TEST"},
        {"product_id": "PANEL-A", "operation_id": "PANEL-A-OP06", "operation_name": "Quality Inspection", "sequence": 6, "duration_minutes": 45,
         "required_machine_types": json.dumps(["M06"]), "required_skills": json.dumps(["Quality Inspection"]),
         "required_tools": json.dumps(["T03", "T08"]), "required_materials": json.dumps({}), "setup_family": "SF_QC"},

        # PANEL-B: 100A Distribution Panel (7 operations)
        {"product_id": "PANEL-B", "operation_id": "PANEL-B-OP01", "operation_name": "Component Preparation", "sequence": 1, "duration_minutes": 120,
         "required_machine_types": json.dumps(["M03"]), "required_skills": json.dumps(["Final Assembly"]),
         "required_tools": json.dumps(["T01", "T03"]), "required_materials": json.dumps({"MAT03": 5, "MAT09": 20, "MAT10": 100, "MAT08": 2}), "setup_family": "SF_PANEL"},
        {"product_id": "PANEL-B", "operation_id": "PANEL-B-OP02", "operation_name": "Busbar Installation", "sequence": 2, "duration_minutes": 90,
         "required_machine_types": json.dumps(["M03"]), "required_skills": json.dumps(["Wiring", "Final Assembly"]),
         "required_tools": json.dumps(["T01", "T04"]), "required_materials": json.dumps({"MAT02": 60, "MAT06": 6}), "setup_family": "SF_PANEL"},
        {"product_id": "PANEL-B", "operation_id": "PANEL-B-OP03", "operation_name": "Wiring", "sequence": 3, "duration_minutes": 240,
         "required_machine_types": json.dumps(["M02"]), "required_skills": json.dumps(["Wiring"]),
         "required_tools": json.dumps(["T04", "T07"]), "required_materials": json.dumps({"MAT02": 50, "MAT13": 5}), "setup_family": "SF_WIRE"},
        {"product_id": "PANEL-B", "operation_id": "PANEL-B-OP04", "operation_name": "Enclosure Assembly", "sequence": 4, "duration_minutes": 100,
         "required_machine_types": json.dumps(["M03"]), "required_skills": json.dumps(["Final Assembly"]),
         "required_tools": json.dumps(["T01"]), "required_materials": json.dumps({"MAT07": 1}), "setup_family": "SF_ENCL"},
        {"product_id": "PANEL-B", "operation_id": "PANEL-B-OP05", "operation_name": "Metering Setup", "sequence": 5, "duration_minutes": 60,
         "required_machine_types": json.dumps(["M04"]), "required_skills": json.dumps(["Electrical Testing"]),
         "required_tools": json.dumps(["T05", "T03"]), "required_materials": json.dumps({"MAT12": 2}), "setup_family": "SF_PROG"},
        {"product_id": "PANEL-B", "operation_id": "PANEL-B-OP06", "operation_name": "Functional Testing", "sequence": 6, "duration_minutes": 120,
         "required_machine_types": json.dumps(["M04", "M05"]), "required_skills": json.dumps(["Electrical Testing"]),
         "required_tools": json.dumps(["T03", "T06"]), "required_materials": json.dumps({}), "setup_family": "SF_TEST"},
        {"product_id": "PANEL-B", "operation_id": "PANEL-B-OP07", "operation_name": "Quality Inspection", "sequence": 7, "duration_minutes": 60,
         "required_machine_types": json.dumps(["M06"]), "required_skills": json.dumps(["Quality Inspection"]),
         "required_tools": json.dumps(["T03", "T08"]), "required_materials": json.dumps({}), "setup_family": "SF_QC"},

        # PANEL-C: Relay Logic Control Panel (5 operations)
        {"product_id": "PANEL-C", "operation_id": "PANEL-C-OP01", "operation_name": "Component Preparation", "sequence": 1, "duration_minutes": 60,
         "required_machine_types": json.dumps(["M01", "M03"]), "required_skills": json.dumps(["PCB Assembly"]),
         "required_tools": json.dumps(["T03"]), "required_materials": json.dumps({"MAT01": 1, "MAT09": 8, "MAT10": 40}), "setup_family": "SF_CTRL"},
        {"product_id": "PANEL-C", "operation_id": "PANEL-C-OP02", "operation_name": "Wiring", "sequence": 2, "duration_minutes": 150,
         "required_machine_types": json.dumps(["M02"]), "required_skills": json.dumps(["Wiring"]),
         "required_tools": json.dumps(["T04", "T07"]), "required_materials": json.dumps({"MAT02": 20, "MAT06": 3, "MAT13": 2}), "setup_family": "SF_WIRE"},
        {"product_id": "PANEL-C", "operation_id": "PANEL-C-OP03", "operation_name": "Enclosure Assembly", "sequence": 3, "duration_minutes": 70,
         "required_machine_types": json.dumps(["M03"]), "required_skills": json.dumps(["Final Assembly"]),
         "required_tools": json.dumps(["T01"]), "required_materials": json.dumps({"MAT03": 2, "MAT07": 1}), "setup_family": "SF_ENCL"},
        {"product_id": "PANEL-C", "operation_id": "PANEL-C-OP04", "operation_name": "Functional Testing", "sequence": 4, "duration_minutes": 80,
         "required_machine_types": json.dumps(["M04", "M05"]), "required_skills": json.dumps(["Electrical Testing"]),
         "required_tools": json.dumps(["T03", "T06"]), "required_materials": json.dumps({}), "setup_family": "SF_TEST"},
        {"product_id": "PANEL-C", "operation_id": "PANEL-C-OP05", "operation_name": "Quality Inspection", "sequence": 5, "duration_minutes": 35,
         "required_machine_types": json.dumps(["M06"]), "required_skills": json.dumps(["Quality Inspection"]),
         "required_tools": json.dumps(["T03", "T08"]), "required_materials": json.dumps({}), "setup_family": "SF_QC"},
    ]
    for r in routings_data:
        exists = db.query(Routing).filter(Routing.operation_id == r["operation_id"]).first()
        if not exists:
            db.add(Routing(**r))
    db.commit()

def seed_maintenance(db: Session):
    maintenance_data = [
        {"maintenance_id": "MNT01", "machine_id": "M01", "start_time": BASE_DATE + timedelta(days=1, hours=10), "end_time": BASE_DATE + timedelta(days=1, hours=12), "maintenance_type": "preventive", "mandatory": True, "description": "Quarterly SMT machine calibration"},
        {"maintenance_id": "MNT02", "machine_id": "M02", "start_time": BASE_DATE + timedelta(days=2, hours=8), "end_time": BASE_DATE + timedelta(days=2, hours=9), "maintenance_type": "preventive", "mandatory": True, "description": "Wire guide roller replacement"},
        {"maintenance_id": "MNT03", "machine_id": "M03", "start_time": BASE_DATE + timedelta(days=3, hours=13), "end_time": BASE_DATE + timedelta(days=3, hours=14, minutes=30), "maintenance_type": "preventive", "mandatory": True, "description": "Torque wrench calibration"},
        {"maintenance_id": "MNT04", "machine_id": "M04", "start_time": BASE_DATE + timedelta(days=1, hours=14), "end_time": BASE_DATE + timedelta(days=1, hours=16), "maintenance_type": "calibration", "mandatory": True, "description": "High-voltage test bench annual calibration"},
        {"maintenance_id": "MNT05", "machine_id": "M05", "start_time": BASE_DATE + timedelta(days=4, hours=6), "end_time": BASE_DATE + timedelta(days=4, hours=8), "maintenance_type": "preventive", "mandatory": True, "description": "Test bench B relay replacement"},
        {"maintenance_id": "MNT06", "machine_id": "M06", "start_time": BASE_DATE + timedelta(days=2, hours=12), "end_time": BASE_DATE + timedelta(days=2, hours=13), "maintenance_type": "preventive", "mandatory": False, "description": "Inspection table lighting check"},
        {"maintenance_id": "MNT07", "machine_id": "M01", "start_time": BASE_DATE + timedelta(days=5, hours=6), "end_time": BASE_DATE + timedelta(days=5, hours=7, minutes=30), "maintenance_type": "preventive", "mandatory": True, "description": "SMT nozzle cleaning and replacement"},
        {"maintenance_id": "MNT08", "machine_id": "M02", "start_time": BASE_DATE + timedelta(days=6, hours=14), "end_time": BASE_DATE + timedelta(days=6, hours=15), "maintenance_type": "corrective", "mandatory": True, "description": "Emergency: Crimping tool fixture repair"},
        {"maintenance_id": "MNT09", "machine_id": "M04", "start_time": BASE_DATE + timedelta(days=7, hours=8), "end_time": BASE_DATE + timedelta(days=7, hours=10), "maintenance_type": "preventive", "mandatory": True, "description": "Monthly test bench verification"},
        {"maintenance_id": "MNT10", "machine_id": "M03", "start_time": BASE_DATE + timedelta(days=8, hours=10), "end_time": BASE_DATE + timedelta(days=8, hours=11), "maintenance_type": "preventive", "mandatory": False, "description": "Assembly fixture cleaning"},
        {"maintenance_id": "MNT11", "machine_id": "M05", "start_time": BASE_DATE + timedelta(days=9, hours=8), "end_time": BASE_DATE + timedelta(days=9, hours=9), "maintenance_type": "calibration", "mandatory": True, "description": "Test bench B meter calibration"},
        {"maintenance_id": "MNT12", "machine_id": "M06", "start_time": BASE_DATE + timedelta(days=10, hours=7), "end_time": BASE_DATE + timedelta(days=10, hours=8), "maintenance_type": "preventive", "mandatory": False, "description": "QC station equipment check"},
    ]
    for m in maintenance_data:
        if not db.query(MaintenanceWindow).filter(MaintenanceWindow.maintenance_id == m["maintenance_id"]).first():
            db.add(MaintenanceWindow(**m))
    db.commit()

def seed_changeover_matrix(db: Session):
    families = ["SF_CTRL", "SF_PCB", "SF_WIRE", "SF_ENCL", "SF_TEST", "SF_QC", "SF_SENSOR", "SF_PANEL", "SF_CAL", "SF_PROG"]
    changeover_times = {
        ("SF_CTRL", "SF_CTRL"): 5, ("SF_CTRL", "SF_PCB"): 10, ("SF_CTRL", "SF_WIRE"): 25,
        ("SF_CTRL", "SF_ENCL"): 20, ("SF_CTRL", "SF_TEST"): 30, ("SF_CTRL", "SF_QC"): 15,
        ("SF_CTRL", "SF_SENSOR"): 15, ("SF_CTRL", "SF_PANEL"): 35, ("SF_CTRL", "SF_CAL"): 30, ("SF_CTRL", "SF_PROG"): 20,
        ("SF_PCB", "SF_CTRL"): 10, ("SF_PCB", "SF_PCB"): 5, ("SF_PCB", "SF_WIRE"): 20,
        ("SF_PCB", "SF_ENCL"): 25, ("SF_PCB", "SF_TEST"): 30, ("SF_PCB", "SF_QC"): 15,
        ("SF_PCB", "SF_SENSOR"): 10, ("SF_PCB", "SF_PANEL"): 35, ("SF_PCB", "SF_CAL"): 25, ("SF_PCB", "SF_PROG"): 15,
        ("SF_WIRE", "SF_CTRL"): 25, ("SF_WIRE", "SF_PCB"): 20, ("SF_WIRE", "SF_WIRE"): 5,
        ("SF_WIRE", "SF_ENCL"): 15, ("SF_WIRE", "SF_TEST"): 30, ("SF_WIRE", "SF_QC"): 20,
        ("SF_WIRE", "SF_SENSOR"): 25, ("SF_WIRE", "SF_PANEL"): 20, ("SF_WIRE", "SF_CAL"): 30, ("SF_WIRE", "SF_PROG"): 25,
        ("SF_ENCL", "SF_CTRL"): 20, ("SF_ENCL", "SF_PCB"): 25, ("SF_ENCL", "SF_WIRE"): 15,
        ("SF_ENCL", "SF_ENCL"): 5, ("SF_ENCL", "SF_TEST"): 25, ("SF_ENCL", "SF_QC"): 15,
        ("SF_ENCL", "SF_SENSOR"): 20, ("SF_ENCL", "SF_PANEL"): 15, ("SF_ENCL", "SF_CAL"): 25, ("SF_ENCL", "SF_PROG"): 20,
        ("SF_TEST", "SF_CTRL"): 30, ("SF_TEST", "SF_PCB"): 30, ("SF_TEST", "SF_WIRE"): 30,
        ("SF_TEST", "SF_ENCL"): 25, ("SF_TEST", "SF_TEST"): 5, ("SF_TEST", "SF_QC"): 10,
        ("SF_TEST", "SF_SENSOR"): 20, ("SF_TEST", "SF_PANEL"): 35, ("SF_TEST", "SF_CAL"): 10, ("SF_TEST", "SF_PROG"): 15,
        ("SF_QC", "SF_CTRL"): 15, ("SF_QC", "SF_PCB"): 15, ("SF_QC", "SF_WIRE"): 20,
        ("SF_QC", "SF_ENCL"): 15, ("SF_QC", "SF_TEST"): 10, ("SF_QC", "SF_QC"): 5,
        ("SF_QC", "SF_SENSOR"): 15, ("SF_QC", "SF_PANEL"): 20, ("SF_QC", "SF_CAL"): 10, ("SF_QC", "SF_PROG"): 15,
        ("SF_SENSOR", "SF_CTRL"): 15, ("SF_SENSOR", "SF_PCB"): 10, ("SF_SENSOR", "SF_WIRE"): 25,
        ("SF_SENSOR", "SF_ENCL"): 20, ("SF_SENSOR", "SF_TEST"): 20, ("SF_SENSOR", "SF_QC"): 15,
        ("SF_SENSOR", "SF_SENSOR"): 5, ("SF_SENSOR", "SF_PANEL"): 30, ("SF_SENSOR", "SF_CAL"): 15, ("SF_SENSOR", "SF_PROG"): 20,
        ("SF_PANEL", "SF_CTRL"): 35, ("SF_PANEL", "SF_PCB"): 35, ("SF_PANEL", "SF_WIRE"): 20,
        ("SF_PANEL", "SF_ENCL"): 15, ("SF_PANEL", "SF_TEST"): 35, ("SF_PANEL", "SF_QC"): 20,
        ("SF_PANEL", "SF_SENSOR"): 30, ("SF_PANEL", "SF_PANEL"): 5, ("SF_PANEL", "SF_CAL"): 35, ("SF_PANEL", "SF_PROG"): 25,
        ("SF_CAL", "SF_CTRL"): 30, ("SF_CAL", "SF_PCB"): 25, ("SF_CAL", "SF_WIRE"): 30,
        ("SF_CAL", "SF_ENCL"): 25, ("SF_CAL", "SF_TEST"): 10, ("SF_CAL", "SF_QC"): 10,
        ("SF_CAL", "SF_SENSOR"): 15, ("SF_CAL", "SF_PANEL"): 35, ("SF_CAL", "SF_CAL"): 5, ("SF_CAL", "SF_PROG"): 15,
        ("SF_PROG", "SF_CTRL"): 20, ("SF_PROG", "SF_PCB"): 15, ("SF_PROG", "SF_WIRE"): 25,
        ("SF_PROG", "SF_ENCL"): 20, ("SF_PROG", "SF_TEST"): 15, ("SF_PROG", "SF_QC"): 15,
        ("SF_PROG", "SF_SENSOR"): 20, ("SF_PROG", "SF_PANEL"): 25, ("SF_PROG", "SF_CAL"): 15, ("SF_PROG", "SF_PROG"): 5,
    }
    existing = db.query(ChangeoverMatrix).count()
    if existing == 0:
        for (from_sf, to_sf), minutes in changeover_times.items():
            db.add(ChangeoverMatrix(from_setup_family=from_sf, to_setup_family=to_sf, changeover_minutes=minutes))
        db.commit()

def seed_orders(db: Session):
    if db.query(Order).count() >= 30:
        return
    
    customers = [
        "Tata Projects Ltd", "L&T Engineering", "Bharat Electronics Ltd",
        "ISRO Satellite Centre", "DRDO DRDL", "Siemens India Ltd",
        "ABB India Ltd", "Schneider Electric India", "Honeywell India",
        "Bosch India Ltd", "Thermax Ltd", "BHEL Haridwar",
        "NTPC Ltd", "Power Grid Corp India", "Indian Railways RDSO",
    ]
    
    products = ["CTRL-A", "CTRL-B", "CTRL-C", "SENSOR-A", "SENSOR-B", "PANEL-A", "PANEL-B", "PANEL-C"]
    
    orders_data = [
        # High priority / urgent orders (due soon)
        {"order_id": "ORD-001", "customer_name": "ISRO Satellite Centre", "product_id": "SENSOR-B", "quantity": 8, "priority": 1, "release_date": BASE_DATE, "due_date": BASE_DATE + timedelta(days=3), "status": "pending", "notes": "Critical: satellite telemetry system"},
        {"order_id": "ORD-002", "customer_name": "Bharat Electronics Ltd", "product_id": "CTRL-B", "quantity": 3, "priority": 1, "release_date": BASE_DATE, "due_date": BASE_DATE + timedelta(days=4), "status": "pending", "notes": "Defence order - priority 1"},
        {"order_id": "ORD-003", "customer_name": "DRDO DRDL", "product_id": "PANEL-A", "quantity": 2, "priority": 1, "release_date": BASE_DATE, "due_date": BASE_DATE + timedelta(days=5), "status": "pending", "notes": "Defence lab power distribution"},
        {"order_id": "ORD-004", "customer_name": "L&T Engineering", "product_id": "CTRL-A", "quantity": 10, "priority": 2, "release_date": BASE_DATE, "due_date": BASE_DATE + timedelta(days=5), "status": "pending", "notes": "Infrastructure project"},
        {"order_id": "ORD-005", "customer_name": "Tata Projects Ltd", "product_id": "PANEL-B", "quantity": 2, "priority": 1, "release_date": BASE_DATE, "due_date": BASE_DATE + timedelta(days=6), "status": "pending", "notes": "Power plant upgrade"},
        {"order_id": "ORD-006", "customer_name": "Siemens India Ltd", "product_id": "CTRL-C", "quantity": 15, "priority": 2, "release_date": BASE_DATE, "due_date": BASE_DATE + timedelta(days=6), "status": "pending", "notes": "Factory automation"},
        {"order_id": "ORD-007", "customer_name": "NTPC Ltd", "product_id": "PANEL-A", "quantity": 3, "priority": 2, "release_date": BASE_DATE, "due_date": BASE_DATE + timedelta(days=7), "status": "pending", "notes": "Power plant control panels"},
        {"order_id": "ORD-008", "customer_name": "Honeywell India", "product_id": "SENSOR-A", "quantity": 20, "priority": 2, "release_date": BASE_DATE, "due_date": BASE_DATE + timedelta(days=7), "status": "pending", "notes": "HVAC monitoring system"},
        {"order_id": "ORD-009", "customer_name": "ABB India Ltd", "product_id": "PANEL-C", "quantity": 5, "priority": 2, "release_date": BASE_DATE, "due_date": BASE_DATE + timedelta(days=8), "status": "pending", "notes": "Robot safety interlock panels"},
        {"order_id": "ORD-010", "customer_name": "Bosch India Ltd", "product_id": "SENSOR-B", "quantity": 12, "priority": 2, "release_date": BASE_DATE, "due_date": BASE_DATE + timedelta(days=8), "status": "pending", "notes": "Production line monitoring"},
        # Medium priority orders
        {"order_id": "ORD-011", "customer_name": "Schneider Electric India", "product_id": "CTRL-B", "quantity": 4, "priority": 3, "release_date": BASE_DATE + timedelta(days=1), "due_date": BASE_DATE + timedelta(days=9), "status": "pending", "notes": "Building automation"},
        {"order_id": "ORD-012", "customer_name": "Thermax Ltd", "product_id": "CTRL-A", "quantity": 6, "priority": 3, "release_date": BASE_DATE + timedelta(days=1), "due_date": BASE_DATE + timedelta(days=10), "status": "pending", "notes": "Boiler control panels"},
        {"order_id": "ORD-013", "customer_name": "BHEL Haridwar", "product_id": "PANEL-A", "quantity": 4, "priority": 3, "release_date": BASE_DATE + timedelta(days=1), "due_date": BASE_DATE + timedelta(days=10), "status": "pending", "notes": "Generator control room"},
        {"order_id": "ORD-014", "customer_name": "Power Grid Corp India", "product_id": "PANEL-B", "quantity": 1, "priority": 2, "release_date": BASE_DATE + timedelta(days=1), "due_date": BASE_DATE + timedelta(days=9), "status": "pending", "notes": "Substation control panel - URGENT"},
        {"order_id": "ORD-015", "customer_name": "Indian Railways RDSO", "product_id": "CTRL-C", "quantity": 20, "priority": 3, "release_date": BASE_DATE + timedelta(days=1), "due_date": BASE_DATE + timedelta(days=11), "status": "pending", "notes": "Station lighting control"},
        {"order_id": "ORD-016", "customer_name": "Tata Projects Ltd", "product_id": "SENSOR-B", "quantity": 15, "priority": 3, "release_date": BASE_DATE + timedelta(days=2), "due_date": BASE_DATE + timedelta(days=12), "status": "pending", "notes": "Smart factory monitoring"},
        {"order_id": "ORD-017", "customer_name": "L&T Engineering", "product_id": "PANEL-C", "quantity": 8, "priority": 3, "release_date": BASE_DATE + timedelta(days=2), "due_date": BASE_DATE + timedelta(days=12), "status": "pending", "notes": "Process plant safety relays"},
        {"order_id": "ORD-018", "customer_name": "Honeywell India", "product_id": "SENSOR-A", "quantity": 25, "priority": 3, "release_date": BASE_DATE + timedelta(days=2), "due_date": BASE_DATE + timedelta(days=13), "status": "pending", "notes": "Cold chain monitoring"},
        {"order_id": "ORD-019", "customer_name": "ABB India Ltd", "product_id": "CTRL-A", "quantity": 8, "priority": 3, "release_date": BASE_DATE + timedelta(days=2), "due_date": BASE_DATE + timedelta(days=13), "status": "pending", "notes": "Conveyor control panels"},
        {"order_id": "ORD-020", "customer_name": "DRDO DRDL", "product_id": "CTRL-B", "quantity": 2, "priority": 1, "release_date": BASE_DATE + timedelta(days=2), "due_date": BASE_DATE + timedelta(days=7), "status": "pending", "notes": "Classified equipment control - RESTRICTED"},
        # Lower priority / future orders
        {"order_id": "ORD-021", "customer_name": "Siemens India Ltd", "product_id": "PANEL-A", "quantity": 5, "priority": 4, "release_date": BASE_DATE + timedelta(days=3), "due_date": BASE_DATE + timedelta(days=14), "status": "pending", "notes": "Warehouse automation"},
        {"order_id": "ORD-022", "customer_name": "Bosch India Ltd", "product_id": "CTRL-C", "quantity": 12, "priority": 4, "release_date": BASE_DATE + timedelta(days=3), "due_date": BASE_DATE + timedelta(days=15), "status": "pending", "notes": "CNC machine upgrades"},
        {"order_id": "ORD-023", "customer_name": "Schneider Electric India", "product_id": "SENSOR-B", "quantity": 10, "priority": 4, "release_date": BASE_DATE + timedelta(days=3), "due_date": BASE_DATE + timedelta(days=15), "status": "pending", "notes": "Energy monitoring network"},
        {"order_id": "ORD-024", "customer_name": "Thermax Ltd", "product_id": "PANEL-C", "quantity": 6, "priority": 4, "release_date": BASE_DATE + timedelta(days=4), "due_date": BASE_DATE + timedelta(days=16), "status": "pending", "notes": "Cooling tower control"},
        {"order_id": "ORD-025", "customer_name": "NTPC Ltd", "product_id": "CTRL-B", "quantity": 3, "priority": 3, "release_date": BASE_DATE + timedelta(days=4), "due_date": BASE_DATE + timedelta(days=16), "status": "pending", "notes": "Turbine auxiliary control"},
        {"order_id": "ORD-026", "customer_name": "Tata Projects Ltd", "product_id": "SENSOR-A", "quantity": 30, "priority": 4, "release_date": BASE_DATE + timedelta(days=4), "due_date": BASE_DATE + timedelta(days=18), "status": "pending", "notes": "Building management system"},
        {"order_id": "ORD-027", "customer_name": "Power Grid Corp India", "product_id": "PANEL-A", "quantity": 3, "priority": 3, "release_date": BASE_DATE + timedelta(days=5), "due_date": BASE_DATE + timedelta(days=18), "status": "pending", "notes": "Switchyard panels"},
        {"order_id": "ORD-028", "customer_name": "Indian Railways RDSO", "product_id": "CTRL-A", "quantity": 12, "priority": 4, "release_date": BASE_DATE + timedelta(days=5), "due_date": BASE_DATE + timedelta(days=20), "status": "pending", "notes": "Signal room control panels"},
        {"order_id": "ORD-029", "customer_name": "BHEL Haridwar", "product_id": "PANEL-B", "quantity": 2, "priority": 3, "release_date": BASE_DATE + timedelta(days=6), "due_date": BASE_DATE + timedelta(days=20), "status": "pending", "notes": "Main LV switchboard"},
        {"order_id": "ORD-030", "customer_name": "L&T Engineering", "product_id": "SENSOR-B", "quantity": 20, "priority": 4, "release_date": BASE_DATE + timedelta(days=6), "due_date": BASE_DATE + timedelta(days=22), "status": "pending", "notes": "Smart city IoT deployment"},
    ]
    
    for o in orders_data:
        if not db.query(Order).filter(Order.order_id == o["order_id"]).first():
            db.add(Order(**o))
    db.commit()

def seed_all(db: Session):
    """Run all seed functions in correct order."""
    seed_users(db)
    seed_skills(db)
    seed_machines(db)
    seed_operators(db)
    seed_tools(db)
    seed_materials(db)
    seed_products_and_routings(db)
    seed_maintenance(db)
    seed_changeover_matrix(db)
    seed_orders(db)
    print("✅ Seed data loaded successfully")
