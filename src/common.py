#!/user/bin/env python
import sys, os, functools, datetime, cgi, hashlib, types

from google.appengine.dist import use_library
use_library('django', '1.2')

from google.appengine.api import users
from google.appengine.ext.webapp import template
import urllib2, urllib, uuid
from google.appengine.api import urlfetch
from django.utils import simplejson
from django.utils.functional import Promise
try:
  # When deployed
  from google.appengine.runtime import DeadlineExceededError
  from google.appengine.runtime import OverQuotaError
  from google.appengine.runtime import RequestTooLargeError
  from google.appengine.runtime import CapabilityDisabledError
 
except ImportError:
  # In the development server
  from google.appengine.runtime.apiproxy_errors import DeadlineExceededError
  from google.appengine.runtime.apiproxy_errors import OverQuotaError
  from google.appengine.runtime.apiproxy_errors import RequestTooLargeError
  from google.appengine.runtime.apiproxy_errors import CapabilityDisabledError

DEBUG = os.environ['SERVER_SOFTWARE'].startswith('Dev')
LOGIN_GUID = '39EBE46BB1C64D1E8983420623496747'

def respond(request, templatefile, params=None):
  if params is None:
    params = {}
  if not templatefile.endswith('.html'):
    templatefile += '.html'
  directory = os.path.dirname(__file__)
  path = os.path.join(directory, os.path.join('templates', templatefile))
  return template.render(path, params, os.environ['SERVER_SOFTWARE'].startswith('Dev'))

def create_logout_url(path):
    if DEBUG:
        return 'http://' + os.environ['HTTP_HOST'] + users.create_logout_url(path + '?guid=' + LOGIN_GUID)
    return users.create_logout_url(path + '?guid=' + LOGIN_GUID)
def create_login_url(path):
    if DEBUG:
        return 'http://' + os.environ['HTTP_HOST'] + users.create_login_url(path + '?guid=' + LOGIN_GUID)
    return users.create_login_url(path + '?guid=' + LOGIN_GUID)

def create_login_logout_json(request):
    goog_user = users.get_current_user()
    json = {}
    if goog_user:
        json['isLogin'] = True
    else:
        json['isLogin'] = False
    json['logout'] = create_logout_url(request.path)
    json['login'] = create_login_url(request.path)
    return json