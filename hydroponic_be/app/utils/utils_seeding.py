from sqlmodel import Session, select

from app.models.command import CmdStatus, CmdType, CmdDef, CmdStat

var_cmd_status: dict[str, int] | None = None
var_cmd_type: dict[str, int] | None = None

def seeding_commands(db: Session):
    for cmd in CmdType:
        db.add(CmdDef(desc=cmd.value))

    for stat in CmdStatus:
        db.add(CmdStat(desc=stat.value))

    db.commit()

def get_var_cmd(db: Session):
    global var_cmd_status, var_cmd_type

    if var_cmd_status is None:
        res = db.exec(select(CmdStat)).all()

        var_cmd_status = {
            stat.desc: stat.id
            for stat in res
            if stat.desc and stat.id
        }

    if var_cmd_type is None:
        res = db.exec(select(CmdDef)).all()

        var_cmd_type = {
            cmd.desc: cmd.id
            for cmd in res
            if cmd.desc and cmd.id
        }

    return var_cmd_status, var_cmd_type