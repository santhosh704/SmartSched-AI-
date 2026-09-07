from app.core.database import Base
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    role = Column(String(30), nullable=False, default="operator")  # admin, production_manager, planner, operator, auditor
    full_name = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)

class Product(Base):
    __tablename__ = "products"
    product_id = Column(String(20), primary_key=True)
    product_name = Column(String(100), nullable=False)
    variant = Column(String(50))
    batch_size = Column(Integer, default=10)
    standard_cost = Column(Float, default=0.0)
    energy_factor = Column(Float, default=1.0)
    description = Column(Text)
    routings = relationship("Routing", back_populates="product")
    orders = relationship("Order", back_populates="product")

class Routing(Base):
    __tablename__ = "routings"
    routing_id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(String(20), ForeignKey("products.product_id"), nullable=False)
    operation_id = Column(String(30), nullable=False)
    operation_name = Column(String(100), nullable=False)
    sequence = Column(Integer, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    required_machine_types = Column(Text)   # JSON list of machine_ids or work_center types
    required_skills = Column(Text)          # JSON list of skill names
    required_tools = Column(Text)           # JSON list of tool_ids
    required_materials = Column(Text)       # JSON dict {material_id: quantity}
    setup_family = Column(String(30))
    product = relationship("Product", back_populates="routings")

class Machine(Base):
    __tablename__ = "machines"
    machine_id = Column(String(20), primary_key=True)
    machine_name = Column(String(100), nullable=False)
    work_center = Column(String(50))
    eligible_operations = Column(Text)      # JSON list of operation names this machine can do
    capacity = Column(Integer, default=1)
    status = Column(String(20), default="active")  # active, maintenance, offline
    energy_rate_kwh = Column(Float, default=2.0)
    description = Column(Text)
    maintenance_windows = relationship("MaintenanceWindow", back_populates="machine")

class Operator(Base):
    __tablename__ = "operators"
    operator_id = Column(String(20), primary_key=True)
    operator_name = Column(String(100), nullable=False)
    shift = Column(String(20), nullable=False)  # morning, evening, night
    skills = Column(Text)                        # JSON: {"PCB Assembly": 2, "Soldering": 3}
    availability = Column(Boolean, default=True)
    overtime_limit_hours = Column(Float, default=2.0)
    cost_per_hour = Column(Float, default=150.0)  # INR per hour

class Skill(Base):
    __tablename__ = "skills"
    skill_id = Column(String(30), primary_key=True)
    skill_name = Column(String(100), nullable=False)
    description = Column(Text)
    level_required = Column(Integer, default=1)

class Tool(Base):
    __tablename__ = "tools"
    tool_id = Column(String(20), primary_key=True)
    tool_name = Column(String(100), nullable=False)
    tool_type = Column(String(50))
    total_quantity = Column(Integer, default=1)
    available_quantity = Column(Integer, default=1)
    description = Column(Text)

class Material(Base):
    __tablename__ = "materials"
    material_id = Column(String(20), primary_key=True)
    material_name = Column(String(100), nullable=False)
    stock_quantity = Column(Float, default=0.0)
    unit = Column(String(20), default="pcs")
    reorder_level = Column(Float, default=10.0)
    lead_time_days = Column(Integer, default=7)
    supplier = Column(String(100))
    cost_per_unit = Column(Float, default=0.0)

class MaintenanceWindow(Base):
    __tablename__ = "maintenance_windows"
    maintenance_id = Column(String(20), primary_key=True)
    machine_id = Column(String(20), ForeignKey("machines.machine_id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    maintenance_type = Column(String(30), default="preventive")  # preventive, corrective, calibration
    mandatory = Column(Boolean, default=True)
    description = Column(Text)
    machine = relationship("Machine", back_populates="maintenance_windows")

class ChangeoverMatrix(Base):
    __tablename__ = "changeover_matrix"
    id = Column(Integer, primary_key=True, autoincrement=True)
    from_setup_family = Column(String(30), nullable=False)
    to_setup_family = Column(String(30), nullable=False)
    changeover_minutes = Column(Integer, default=15)

class Order(Base):
    __tablename__ = "orders"
    order_id = Column(String(20), primary_key=True)
    customer_name = Column(String(100), nullable=False)
    product_id = Column(String(20), ForeignKey("products.product_id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    priority = Column(Integer, default=3)  # 1=Critical, 2=High, 3=Medium, 4=Low, 5=Routine
    release_date = Column(DateTime, nullable=False)
    due_date = Column(DateTime, nullable=False)
    status = Column(String(20), default="pending")  # pending, scheduled, in_progress, completed, cancelled
    notes = Column(Text)
    product = relationship("Product", back_populates="orders")

class Schedule(Base):
    __tablename__ = "schedules"
    schedule_id = Column(String(30), primary_key=True)
    objective = Column(String(30), nullable=False)  # baseline, delivery_first, cost_first, balanced
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(50))
    is_active = Column(Boolean, default=True)
    solve_time_seconds = Column(Float, default=0.0)
    feasible = Column(Boolean, default=True)
    on_time_percentage = Column(Float, default=0.0)
    late_orders_count = Column(Integer, default=0)
    total_tardiness_minutes = Column(Float, default=0.0)
    avg_tardiness_minutes = Column(Float, default=0.0)
    overtime_hours = Column(Float, default=0.0)
    changeover_hours = Column(Float, default=0.0)
    constraint_violations = Column(Integer, default=0)
    estimated_cost = Column(Float, default=0.0)
    estimated_energy_kwh = Column(Float, default=0.0)
    machine_utilization = Column(Float, default=0.0)
    operator_utilization = Column(Float, default=0.0)
    tool_utilization = Column(Float, default=0.0)
    schedule_start = Column(DateTime)
    schedule_end = Column(DateTime)
    date_range_start = Column(DateTime)
    date_range_end = Column(DateTime)
    soft_weights = Column(Text)  # JSON
    total_orders = Column(Integer, default=0)
    on_time_orders = Column(Integer, default=0)
    assignments = relationship("ScheduleAssignment", back_populates="schedule")

class ScheduleAssignment(Base):
    __tablename__ = "schedule_assignments"
    assignment_id = Column(Integer, primary_key=True, autoincrement=True)
    schedule_id = Column(String(30), ForeignKey("schedules.schedule_id"), nullable=False)
    order_id = Column(String(20), nullable=False)
    routing_id = Column(Integer, nullable=True)
    operation_name = Column(String(100))
    operation_id = Column(String(30))
    sequence = Column(Integer, default=1)
    machine_id = Column(String(20), nullable=True)
    operator_id = Column(String(20), nullable=True)
    tool_ids = Column(Text)          # JSON list
    material_allocations = Column(Text)  # JSON dict
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    setup_start_time = Column(DateTime, nullable=True)
    changeover_minutes = Column(Integer, default=0)
    status = Column(String(20), default="feasible")  # feasible, infeasible, overridden
    constraint_violations = Column(Text)  # JSON list of violation messages
    explanation = Column(Text)
    is_overtime = Column(Boolean, default=False)
    duration_minutes = Column(Integer, default=0)
    product_id = Column(String(20))
    schedule = relationship("Schedule", back_populates="assignments")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    username = Column(String(50))
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50))
    entity_id = Column(String(50))
    old_value = Column(Text)  # JSON
    new_value = Column(Text)  # JSON
    timestamp = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String(50))
    constraint_violated = Column(String(100))
    override_reason = Column(Text)
    approval_status = Column(String(20))  # pending, approved, rejected
    risk_level = Column(String(20))  # low, medium, high, critical
    details = Column(Text)

class ConstraintOverride(Base):
    __tablename__ = "constraint_overrides"
    id = Column(Integer, primary_key=True, autoincrement=True)
    schedule_id = Column(String(30))
    assignment_id = Column(Integer, nullable=True)
    constraint_type = Column(String(50))
    constraint_code = Column(String(10))  # H1, H2, etc.
    description = Column(Text)
    requested_by_username = Column(String(50))
    approved_by_username = Column(String(50), nullable=True)
    status = Column(String(20), default="pending")  # pending, approved, rejected
    reason = Column(Text)
    risk_level = Column(String(20), default="medium")
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    old_schedule_data = Column(Text)
    new_schedule_data = Column(Text)
