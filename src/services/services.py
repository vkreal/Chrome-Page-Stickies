import hashlib, logging, urllib, datetime, sys, base64, os, string, cgi
from common import *
from google.appengine.ext import webapp
from google.appengine.api import memcache
from google.appengine.api import urlfetch
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext import db
from google.appengine.api import images
from google.appengine.api import memcache
from google.appengine.api import users
from google.appengine.ext.webapp import template
from django.utils import simplejson
import models

class MainPage(webapp.RequestHandler):
   def get(self):
       goog_user = users.get_current_user()
       if goog_user:
           self.response.out.write('<a href="' + users.create_logout_url(self.request.path) + '">Logout</a>')
       else:
           self.response.out.write('<a href="' + users.create_login_url(self.request.path) + '">LogIn</a>')

class GetStickiesHandler(webapp.RequestHandler):
     def post(self):
       user = models.get_user()
       if user:
           loc = simplejson.loads(self.request.get('payload'))
           path = loc['origin'] + loc['pathname']
           pages = models.Page.gql("WHERE owner = :1 AND url = :2 ", user.bucket_set[0], path)
           
           if pages.count() > 0:
               page = pages[0]
               pagekey = str(page.key())
               stickies=[]
               
               for sticky in page.sticky_set:
                  if sticky.is_deleted == False:
                      json = {}
                      json['pagekey'] = pagekey
                      content = simplejson.loads(sticky.content)
                      content['key'] = str(sticky.key())
                      json['content'] = simplejson.dumps(content)
                  
                      #json['updated'] = sticky.updated 
                      stickies.append(json)
           
               self.response.out.write(simplejson.dumps(stickies))
       else:
           self.response.out.write(simplejson.dumps(create_login_logout_json(self.request)))
               
class PutStickyHandler(webapp.RequestHandler):
    def post(self):
        user = models.get_or_create_user()
        if user:
            payload = self.request.get('payload')
            if payload: 
                json = simplejson.loads(payload)
                action = json['action']
                if action == 'update' and json:
                    pagekey = json['pagekey']
                    sticky = json['data']
                    loc = simplejson.loads(json['loc'])
                    if loc:
                        path = loc['origin'] + loc['pathname']
                        pages = models.Page.gql("WHERE owner = :1 AND url = :2 ", user.bucket_set[0], path)
                        #pages.filter("owner = ", user)
                        if pages.count() <= 0:
                            page = models.get_or_create_page(user.bucket_set[0], path, loc['href'], pagekey)
                        else:
                            page = pages[0]
                        #if page:
                        saved = models.create_or_update_sticky(page, simplejson.dumps(sticky), sticky['key'])
                        sticky['key'] = str(saved.key())
                        #sticky['pagekey'] = str(page.key())
                        
                        self.response.out.write(simplejson.dumps(sticky))
                        
                if action == 'remove' and json:
                    data = json['data']
                    if data['key']:
                        sticky = models.Sticky.get(data['key'])
                        if sticky: # do soft delete
                            sticky.is_deleted = True
                            sticky.put()
                            #db.delete(sticky)
                
class GetIsLogonHandler(webapp.RequestHandler):
    def get(self):
       self.response.out.write(simplejson.dumps(create_login_logout_json(self.request)))
           
application = webapp.WSGIApplication(
                                     [('/services/', MainPage),
                                      ('/services/get/.*', GetStickiesHandler),
                                      ('/services/put/.*', PutStickyHandler),
                                      ('/services/islogin/.*', GetIsLogonHandler)
                                      ],
                                     debug=True)
def main():
  run_wsgi_app(application)

if __name__ == "__main__":
  main()