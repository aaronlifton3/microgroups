// Groups -- {name: String, user_id: Integer (Meteor.user)}
Groups = new Meteor.Collection("groups");

// Publish complete set of lists to all clients.
Meteor.publish('groups', function () {
  return Groups.find();
});


// Posts -- {text: String,
//           user_id: Integer (Meteor.user)
//           posts: [Post, ...],
//           list_id: String,
//           parent_id: Integer
//           timestamp: Number}
Posts = new Meteor.Collection("posts");

// Publish all posts for requested list_id.
Meteor.publish('posts', function (group_id) {
  return Posts.find({group_id: group_id});
});