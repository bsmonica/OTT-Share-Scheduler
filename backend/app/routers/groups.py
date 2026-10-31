import random
import string
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.group import Group, GroupMember
from app.models.user import User
from app.schemas.group import GroupCreate, GroupResponse, GroupJoinRequest, GroupMemberResponse
from app.utils.auth import get_current_user

router = APIRouter(prefix="/groups", tags=["Groups"])

def generate_group_code(length: int = 6) -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

@router.post("", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(group_data: GroupCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Generate unique group code
    for _ in range(10):
        code = generate_group_code()
        if not db.query(Group).filter(Group.group_code == code).first():
            break
    else:
        code = generate_group_code(8)

    new_group = Group(
        name=group_data.name.strip(),
        description=group_data.description.strip() if group_data.description else None,
        group_code=code,
        created_by=current_user.id
    )
    db.add(new_group)
    db.commit()
    db.refresh(new_group)

    # Automatically add creator as group admin
    membership = GroupMember(
        group_id=new_group.id,
        user_id=current_user.id,
        role="admin"
    )
    db.add(membership)
    db.commit()

    return {
        "id": new_group.id,
        "name": new_group.name,
        "description": new_group.description,
        "group_code": new_group.group_code,
        "created_by": new_group.created_by,
        "created_at": new_group.created_at,
        "member_count": 1,
        "members": [
            {
                "id": membership.id,
                "user_id": current_user.id,
                "user_name": current_user.name,
                "user_email": current_user.email,
                "role": "admin",
                "joined_at": membership.joined_at
            }
        ]
    }

@router.get("", response_model=List[GroupResponse])
def get_user_groups(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "admin":
        groups = db.query(Group).all()
    else:
        groups = db.query(Group).join(GroupMember).filter(GroupMember.user_id == current_user.id).all()

    result = []
    for g in groups:
        member_count = db.query(GroupMember).filter(GroupMember.group_id == g.id).count()
        result.append({
            "id": g.id,
            "name": g.name,
            "description": g.description,
            "group_code": g.group_code,
            "created_by": g.created_by,
            "created_at": g.created_at,
            "member_count": member_count,
            "members": []
        })
    return result

@router.post("/join", response_model=GroupResponse)
def join_group_by_code(payload: GroupJoinRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    code = payload.group_code.strip().upper()
    group = db.query(Group).filter(Group.group_code == code).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid group code"
        )
    
    # Check if already a member
    existing = db.query(GroupMember).filter(
        GroupMember.group_id == group.id,
        GroupMember.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of this group"
        )

    # Add to group
    membership = GroupMember(
        group_id=group.id,
        user_id=current_user.id,
        role="member"
    )
    db.add(membership)
    db.commit()

    member_count = db.query(GroupMember).filter(GroupMember.group_id == group.id).count()
    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "group_code": group.group_code,
        "created_by": group.created_by,
        "created_at": group.created_at,
        "member_count": member_count,
        "members": []
    }

@router.post("/{group_id}/join", response_model=GroupResponse)
def join_group_by_id(group_id: int, payload: GroupJoinRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    
    if group.group_code.upper() != payload.group_code.strip().upper():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect group code")

    existing = db.query(GroupMember).filter(
        GroupMember.group_id == group.id,
        GroupMember.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You are already a member of this group")

    membership = GroupMember(group_id=group.id, user_id=current_user.id, role="member")
    db.add(membership)
    db.commit()

    member_count = db.query(GroupMember).filter(GroupMember.group_id == group.id).count()
    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "group_code": group.group_code,
        "created_by": group.created_by,
        "created_at": group.created_at,
        "member_count": member_count,
        "members": []
    }

@router.get("/{group_id}", response_model=GroupResponse)
def get_group_details(group_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    
    # Check membership unless admin
    if current_user.role != "admin":
        membership = db.query(GroupMember).filter(
            GroupMember.group_id == group.id,
            GroupMember.user_id == current_user.id
        ).first()
        if not membership:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this group")

    members = db.query(GroupMember).filter(GroupMember.group_id == group.id).all()
    member_list = []
    for m in members:
        u = db.query(User).filter(User.id == m.user_id).first()
        if u:
            member_list.append({
                "id": m.id,
                "user_id": u.id,
                "user_name": u.name,
                "user_email": u.email,
                "role": m.role,
                "joined_at": m.joined_at
            })

    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "group_code": group.group_code,
        "created_by": group.created_by,
        "created_at": group.created_at,
        "member_count": len(member_list),
        "members": member_list
    }

@router.get("/{group_id}/members", response_model=List[GroupMemberResponse])
def get_group_members(group_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    
    if current_user.role != "admin":
        membership = db.query(GroupMember).filter(
            GroupMember.group_id == group.id,
            GroupMember.user_id == current_user.id
        ).first()
        if not membership:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    members = db.query(GroupMember).filter(GroupMember.group_id == group.id).all()
    result = []
    for m in members:
        u = db.query(User).filter(User.id == m.user_id).first()
        if u:
            result.append({
                "id": m.id,
                "user_id": u.id,
                "user_name": u.name,
                "user_email": u.email,
                "role": m.role,
                "joined_at": m.joined_at
            })
    return result
