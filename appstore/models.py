from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class AppMetadata(Base):
    __tablename__ = 'app_metadata'

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    repository_url = Column(String(255), nullable=False)
    docker_compose_file = Column(String(255), nullable=True)
    docker_image = Column(String(255), nullable=True)
    start_command = Column(Text, nullable=True)
    stop_command = Column(Text, nullable=True)

    def __repr__(self):
        return f"<AppMetadata(name='{self.name}', id={self.id})>"