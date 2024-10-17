from sqlalchemy import Column, Integer, String, Text, JSON
from uuid import uuid4
from flask_login import UserMixin
from appstore import db


def get_uuid():
    return uuid4().hex

class AppMetadata(db.Model):
    __tablename__ = 'app_metadata'

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    display_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    full_description = Column(Text, nullable=True)
    logo = Column(String(255), nullable=True)
    image = Column(String(255), nullable=True)
    link = Column(String(255), nullable=True)
    tags = Column(JSON, nullable=True)
    repository_url = Column(String(255), nullable=False)
    docker_compose_file = Column(String(255), nullable=True)
    docker_image = Column(String(255), nullable=True)
    start_command = Column(Text, nullable=True)
    stop_command = Column(Text, nullable=True)

    def __repr__(self):
        return f"<AppMetadata(id={self.id}, name='{self.name}', display_name='{self.display_name}', description='{self.description}', full_description='{self.full_description}', logo='{self.logo}', image='{self.image}', link='{self.link}', tags='{self.tags}', repository_url='{self.repository_url}')>"
    
class User(db.Model, UserMixin):
    __tablename__ = 'users'

    id = Column(String(36), primary_key=True, default=get_uuid, unique=True)
    username = Column(String(150), nullable=False)
    password = Column(String(150), nullable=False)
    email = Column(String(150), nullable=False)
    organisation = Column(String(150), nullable=True)
    title = Column(String(150), nullable=True)

    def get_id(self):
        return str(self.id)

    def __repr__(self):
        return f"<User(username='{self.username}', id={self.id})>"