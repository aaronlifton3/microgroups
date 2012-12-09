// Client-side JavaScript, bundled and sent to client.

// Define Minimongo collections to match server/publish.js.
Groups = new Meteor.Collection("groups");
Posts = new Meteor.Collection("posts");

// ID of currently selected group
Session.set('group_id', null);

// When editing a group name, ID of the group
Session.set('editing_groupname', null);

// When editing post text, ID of the post
Session.set('editing_itemname', null);

// Subscribe to 'groups' collection on startup.
// Select a group once data has arrived.
Meteor.subscribe('groups', function () {
  if (!Session.get('group_id')) {
    var group = Groups.findOne({}, {sort: {name: 1}});
    if (group)
      Router.setGroup(group._id);
  }
});

// Always be subscribed to the posts for the selected group.
Meteor.autosubscribe(function () {
  var group_id = Session.get('group_id');
  if (group_id)
    Meteor.subscribe('posts', group_id);
});


////////// Helpers for in-place editing //////////

// Returns an event map that handles the "escape" and "return" keys and
// "blur" events on a text input (given by selector) and interprets them
// as "ok" or "cancel".
var okCancelEvents = function (selector, callbacks) {
  var ok = callbacks.ok || function () {};
  var cancel = callbacks.cancel || function () {};

  var events = {};
  events['keyup '+selector+', keydown '+selector+', focusout '+selector] =
    function (evt) {
      if (evt.type === "keydown" && evt.which === 27) {
        // escape = cancel
        cancel.call(this, evt);

      } else if (evt.type === "keyup" && evt.which === 13 ||
                 evt.type === "focusout") {
        // blur/return/enter = ok/submit if non-empty
        var value = String(evt.target.value || "");
        if (value)
          ok.call(this, value, evt);
        else
          cancel.call(this, evt);
      }
    };
  return events;
};

var activateInput = function (input) {
  input.focus();
  input.select();
};

////////// Groups //////////

Template.groups.groups = function () {
  return Groups.find({}, {sort: {name: 1}});
};

Template.groups.events({
  'mousedown .group': function (evt) { // select group
    Router.setGroup(this._id);
  },
  'click .group': function (evt) {
    // prevent clicks on <a> from refreshing the page.
    evt.preventDefault();
  },
  'dblclick .group': function (evt, tmpl) { // start editing group name
    Session.set('editing_groupname', this._id);
    Meteor.flush(); // force DOM redraw, so we can focus the edit field
    activateInput(tmpl.find("#group-name-input"));
  }
});

// Attach events to keydown, keyup, and blur on "New group" input box.
Template.groups.events(okCancelEvents(
  '#new-group',
  {
    ok: function (text, evt) {
      var id = Groups.insert({name: text, user_id: currentUserId()});
      Router.setGroup(id);
      evt.target.value = "";
    }
  }));

Template.groups.events(okCancelEvents(
  '#group-name-input',
  {
    ok: function (value) {
      Groups.update(this._id, {$set: {name: value}});
      Session.set('editing_groupname', null);
    },
    cancel: function () {
      Session.set('editing_groupname', null);
    }
  }));

Template.groups.selected = function () {
  return Session.equals('group_id', this._id) ? 'selected' : '';
};

Template.groups.name_class = function () {
  return this.name ? '' : 'empty';
};

Template.groups.editing = function () {
  return Session.equals('editing_groupname', this._id);
};

Template.groups.username = function () {
  if(this.user_id) {
  	var u = Meteor.users.findOne({'_id': this.user_id});
	if(u != undefined) {return u.profile.name;}
  } else {
	  return "Anonymous"
  }
};

////////// Posts //////////

Template.posts.any_group_selected = function () {
  return !Session.equals('group_id', null);
};

var currentUserId = function() {
	if(Meteor.user()) {
		return Meteor.user()._id;
	}
}

Template.posts.events(okCancelEvents(
  '#new-post',
  {
    ok: function (text, evt) {
      Posts.insert({
        text: text,
		user_id: currentUserId(),
        group_id: Session.get('group_id'),
		parent_id: 0,
		replies: [],
        timestamp: (new Date()).getTime()
      });
      evt.target.value = '';
    }
  }));

Template.posts.posts = function () {
  // Determine which posts to display in main pane,
  // selected based on group_id and tag_filter.

  var group_id = Session.get('group_id');
  if (!group_id)
    return {};

  var sel = {group_id: group_id, parent_id: 0};

  return Posts.find(sel, {sort: {timestamp: -1}});
};

Template.post_item.replies = function () {
  // Determine which posts to display in main pane,
  // selected based on group_id and tag_filter.

  var group_id = Session.get('group_id');
  if (!group_id)
    return {};

  var sel = {parent_id: this._id};

  return Posts.find(sel, {sort: {timestamp: -1}});
};

Template.post_item.editing = function () {
  return Session.equals('editing_itemname', this._id);
};

/*Template.post_item.replying = function () {
  return Session.equals('replying_itemname', this._id);
};*/

Template.post_item.username = function () {
  if(this.user_id) {
  	var u = Meteor.users.findOne({'_id': this.user_id});
	if(u != undefined) {return u.profile.name;}
  } else {
	  return "Anonymous"
  }
};

Template.post_item.events({
  'click .check': function () {
    Posts.update(this._id, {$set: {done: !this.done}});
  },

  'click .destroy': function () {
    Posts.remove(this._id);
  },

  'dblclick .display .post-text': function (evt, tmpl) {
    Session.set('editing_itemname', this._id);
    Meteor.flush(); // update DOM before focus
    activateInput(tmpl.find("#post-input"));
  },

  /*'click .reply': function (evt, tmpl) {
    evt.preventDefault();
    Session.set('replying_itemname', this._id);
    Meteor.flush(); // update DOM before focus
	var el = tmpl.find("#reply-post-"+this._id);
    activateInput(el);
	$(el).toggle();
  },*/

  'click .remove': function (evt) {
    //var tag = this.tag;
    var id = this.post_id;

    evt.target.parentNode.style.opacity = 0;
    // wait for CSS animation to finish
    Meteor.setTimeout(function () {
      //Posts.update({_id: id}, {$pull: {tags: tag}});
      Posts.update({_id: id});
    }, 300);
  }
});

Template.post_item.events(okCancelEvents(
  '#post-input',
  {
    ok: function (value) {
      Posts.update(this._id, {$set: {text: value}});
      Session.set('editing_itemname', null);
    },
    cancel: function () {
      Session.set('editing_itemname', null);
    }
  }));

////////// Tracking selected group in URL //////////

var PostsRouter = Backbone.Router.extend({
  routes: {
    ":group_id": "main"
  },
  main: function (group_id) {
    Session.set("group_id", group_id);
  },
  setGroup: function (group_id) {
    this.navigate(group_id, true);
  }
});

Router = new PostsRouter;

Meteor.startup(function () {
  Backbone.history.start({pushState: true});
});

// Facebook auth
if (Meteor.is_server) {
    Meteor.methods({
		extra_startup: function() {
			//startup_actions();
		},
        facebook_login: function(fbUser, accessToken) {
            var options, serviceData, userId;
            serviceData = {
              id: fbUser.id,
              accessToken: accessToken,
              email: fbUser.email
            };
            options = {
              profile: {
                name: fbUser.name
              }
            };
            return userId = Accounts.updateOrCreateUserFromExternalService('facebook', serviceData, options).id;
        }
   });
}
