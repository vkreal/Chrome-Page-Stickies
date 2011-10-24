#!/user/bin/env python
import hashlib, logging, urllib, datetime, sys, base64, os
from common import *
from google.appengine.ext import db
from google.appengine.api import memcache
import wsgiref.handlers
from google.appengine.ext import webapp
from google.appengine.ext.webapp import template
from google.appengine.api import users
from google.appengine.ext.webapp.util import run_wsgi_app
from django.utils import simplejson
  
class PageHandler(webapp.RequestHandler):
    def get(self):
        self.response.out.write(respond(self.request, 'index.html'))

application = webapp.WSGIApplication([('/.*', PageHandler)], debug=False)    

def main():
    wsgiref.handlers.CGIHandler().run(application)
    
if __name__=='__main__':
     main()
  
  