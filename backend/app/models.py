from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, Float, ForeignKey, func
)
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    vignettes = relationship("Vignette", back_populates="author")
    photos = relationship("Photo", back_populates="uploaded_by")
    audio_recordings = relationship("AudioRecording", back_populates="author")
    files = relationship("File", back_populates="uploaded_by")
    invite_codes_created = relationship("InviteCode", foreign_keys="InviteCode.created_by_id", back_populates="created_by")
    family_members_created = relationship("FamilyMember", back_populates="created_by")


class InviteCode(Base):
    __tablename__ = "invite_codes"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    used_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    created_by = relationship("User", foreign_keys=[created_by_id], back_populates="invite_codes_created")
    used_by = relationship("User", foreign_keys=[used_by_id])


class Vignette(Base):
    __tablename__ = "vignettes"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    author = relationship("User", back_populates="vignettes")
    vignette_photos = relationship("VignettePhoto", back_populates="vignette", cascade="all, delete-orphan")


class Photo(Base):
    __tablename__ = "photos"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    title = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    taken_at = Column(DateTime(timezone=True), nullable=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    uploaded_by = relationship("User", back_populates="photos")
    vignette_photos = relationship("VignettePhoto", back_populates="photo")
    album_photos = relationship("AlbumPhoto", back_populates="photo")
    photo_people = relationship("PhotoPerson", back_populates="photo", cascade="all, delete-orphan")


class VignettePhoto(Base):
    __tablename__ = "vignette_photos"
    id = Column(Integer, primary_key=True, index=True)
    vignette_id = Column(Integer, ForeignKey("vignettes.id"), nullable=False)
    photo_id = Column(Integer, ForeignKey("photos.id"), nullable=False)
    position = Column(Integer, default=0)

    vignette = relationship("Vignette", back_populates="vignette_photos")
    photo = relationship("Photo", back_populates="vignette_photos")


class Album(Base):
    __tablename__ = "albums"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sort_order = Column(Integer, default=0)
    background_image = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    created_by = relationship("User")
    album_photos = relationship("AlbumPhoto", back_populates="album", cascade="all, delete-orphan")


class AlbumPhoto(Base):
    __tablename__ = "album_photos"
    id = Column(Integer, primary_key=True, index=True)
    album_id = Column(Integer, ForeignKey("albums.id"), nullable=False)
    photo_id = Column(Integer, ForeignKey("photos.id"), nullable=False)
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    sort_order = Column(Integer, default=0)

    album = relationship("Album", back_populates="album_photos")
    photo = relationship("Photo", back_populates="album_photos")


class Person(Base):
    __tablename__ = "people"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)

    photo_people = relationship("PhotoPerson", back_populates="person", cascade="all, delete-orphan")


class PhotoPerson(Base):
    __tablename__ = "photo_people"
    id = Column(Integer, primary_key=True, index=True)
    photo_id = Column(Integer, ForeignKey("photos.id"), nullable=False)
    person_id = Column(Integer, ForeignKey("people.id"), nullable=False)

    photo = relationship("Photo", back_populates="photo_people")
    person = relationship("Person", back_populates="photo_people")


class AudioRecording(Base):
    __tablename__ = "audio_recordings"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    title = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    duration_seconds = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    author = relationship("User", back_populates="audio_recordings")


class File(Base):
    __tablename__ = "files"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    title = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    file_type = Column(String, nullable=True)
    source = Column(String, default="files")  # "vignettes" | "files"
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    extracted_text = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    uploaded_by = relationship("User", back_populates="files")


class BackgroundImage(Base):
    __tablename__ = "background_images"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    uploaded_by = relationship("User")


class FamilyMember(Base):
    __tablename__ = "family_members"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=True)
    birth_date = Column(String, nullable=True)
    death_date = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    gender = Column(String, nullable=True)  # 'male' | 'female' | None
    photo_id = Column(Integer, ForeignKey("photos.id"), nullable=True)
    position_x = Column(Float, default=0.0)
    position_y = Column(Float, default=0.0)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    created_by = relationship("User", back_populates="family_members_created")
    photo = relationship("Photo")
    relationships_as_a = relationship("FamilyRelationship", foreign_keys="FamilyRelationship.person_a_id", back_populates="person_a", cascade="all, delete-orphan")
    relationships_as_b = relationship("FamilyRelationship", foreign_keys="FamilyRelationship.person_b_id", back_populates="person_b", cascade="all, delete-orphan")


class FamilyRelationship(Base):
    __tablename__ = "family_relationships"
    id = Column(Integer, primary_key=True, index=True)
    person_a_id = Column(Integer, ForeignKey("family_members.id"), nullable=False)
    person_b_id = Column(Integer, ForeignKey("family_members.id"), nullable=False)
    relationship_type = Column(String, nullable=False)  # parent_child | spouse | sibling
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    person_a = relationship("FamilyMember", foreign_keys=[person_a_id], back_populates="relationships_as_a")
    person_b = relationship("FamilyMember", foreign_keys=[person_b_id], back_populates="relationships_as_b")


class Tag(Base):
    __tablename__ = "tags"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    category = Column(String, nullable=False)  # person | place | event | topic
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    content_tags = relationship("ContentTag", back_populates="tag", cascade="all, delete-orphan")


class ContentTag(Base):
    __tablename__ = "content_tags"
    id = Column(Integer, primary_key=True, index=True)
    tag_id = Column(Integer, ForeignKey("tags.id"), nullable=False)
    content_type = Column(String, nullable=False)  # vignette | photo | audio | file
    content_id = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tag = relationship("Tag", back_populates="content_tags")


class SiteSetting(Base):
    __tablename__ = "site_settings"
    key = Column(String, primary_key=True)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
