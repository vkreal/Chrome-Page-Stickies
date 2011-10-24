from google.appengine.ext import db
import sys, datetime, logging, hashlib, string, cgi
from google.appengine.api import memcache
from google.appengine.ext import search
from google.appengine.api import users
import generalcounter

class User(db.Expando):
    goog_user = db.UserProperty()
    created = db.DateTimeProperty(auto_now_add=True)
    updated = db.DateTimeProperty(auto_now=True)
    showWelcome = db.BooleanProperty(default=True)
    first_name = db.StringProperty(required=False)
    last_name = db.StringProperty(required=False)
    name = db.StringProperty(required=False)

class Bucket(db.Expando):
    owner = db.ReferenceProperty(User, required=True, collection_name='bucket_set')
    created = db.DateTimeProperty(auto_now_add=True)
    updated = db.DateTimeProperty(auto_now=True)
    name = db.StringProperty(required=True)
    
class Page(db.Expando):
    ip = db.StringProperty()
    owner = db.ReferenceProperty(Bucket, required=True, collection_name='page_set')
    created = db.DateTimeProperty(auto_now_add=True)
    updated = db.DateTimeProperty(auto_now=True)
    url = db.StringProperty(required=True)
    href = db.TextProperty(required=False)
    
class Sticky(db.Expando):
    ip = db.StringProperty()
    owner = db.ReferenceProperty(Page, required=True, collection_name='sticky_set')
    created = db.DateTimeProperty(auto_now_add=True)
    updated = db.DateTimeProperty(auto_now=True)
    content = db.TextProperty(default='{}')
    is_deleted = db.BooleanProperty(default=False)

def get_or_create_page(bucket, url, href, key=None):
    if key:
        return Page.get(key)
    else:
        page = Page(ip=cgi.os.environ['REMOTE_ADDR'],
                    owner=bucket, url=url, href=href)
        page.put()
        generalcounter.increment('page')
        return page
    
def create_or_update_sticky(page, content, key=None):
    sticky = None
    if key:
        sticky = Sticky.get(key)
        if sticky:
            sticky.ip=cgi.os.environ['REMOTE_ADDR']
            sticky.content = content
            
    else:
        sticky = Sticky(ip=cgi.os.environ['REMOTE_ADDR'],
                owner = page,
                content = content)
        generalcounter.increment('sticky')
    if sticky:
        sticky.put()
    return sticky

def get_user():
    goog_user = users.get_current_user()
    if goog_user:
        return User.get_by_key_name(goog_user.email())
    return None

def get_or_create_user():
  """
  Find a matching User or create a new one with the
  email as the key_name.
  
  Returns a User for the given goog_user.
  """
  goog_user = users.get_current_user()
  if goog_user:
      user = User.get_by_key_name(goog_user.email())
      if user is None:
        user = User(key_name=goog_user.email(), goog_user=goog_user)
        generalcounter.increment('user')
        user.put()
        bucket = Bucket(owner=user, name='Home')
        bucket.put()
        generalcounter.increment('bucket')
      return user
  return None