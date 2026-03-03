from sqlmodel import Session, select
from app.models.telemetry import Telemetry

def create_telemetry_data(db: Session, telemetry_data: Telemetry):
    # 1. Logika Simpan Data
    db.add(telemetry_data)
    db.commit()
    db.refresh(telemetry_data)
    
    # 2. Logika Pengolahan Data / Cek Anomali
    check_for_anomalies(telemetry_data)
    
    return telemetry_data

def check_for_anomalies(data: Telemetry):
    # Contoh logika sederhana untuk Smart Farming
    if data.ph < 5.5 or data.ph > 6.5:
        print(f"🚨 ALERT: Anomali pH terdeteksi di Rak {data.rack_id}! Nilai: {data.ph}")
        # Di sini nanti kamu bisa panggil service kirim WhatsApp/Email/Notif
    
    if data.tds > 1200:
        print(f"🚨 ALERT: TDS terlalu tinggi di Rak {data.rack_id}!")

def get_latest_by_rack(db: Session, rack_id: int):
    statement = select(Telemetry).where(Telemetry.rack_id == rack_id).order_by(Telemetry.timestamp.desc())
    return db.exec(statement).first()