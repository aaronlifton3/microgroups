// if the database is empty on server start, create some sample data.
Meteor.startup(function () {
    if (Groups.find().count() === 0) {
      var data = [
        {name: "Meteor Principles",
         contents: [
           ["Data on the Wire"],
           ["One Language"],
           ["Database Everywhere"],
           ["Latency Compensation"],
           ["Full Stack Reactivity"],
           ["Embrace the Ecosystem"],
           ["Simplicity Equals Productivity"]
         ]
        },
        {name: "Languages",
         contents: [
           ["Lisp"],
           ["C"],
           ["C++",],
           ["Python"],
           ["Ruby"],
           ["JavaScript"],
           ["Scala"],
           ["Erlang"],
           ["6502 Assembly"]
           ]
        },
        {name: "Favorite Scientists",
         contents: [
           ["Ada Lovelace"],
           ["Grace Hopper"],
           ["Marie Curie"],
           ["Carl Friedrich Gauss"],
           ["Nikola Tesla"],
           ["Claude Shannon"]
         ]
        }
      ];

      var timestamp = (new Date()).getTime();
      for (var i = 0; i < data.length; i++) {
        var group_id = Groups.insert({name: data[i].name});
        for (var j = 0; j < data[i].contents.length; j++) {
          var info = data[i].contents[j];
          Posts.insert({group_id: group_id,
                        text: info[0],
                        timestamp: timestamp});
          timestamp += 1; // ensure unique timestamp.
        }
      }
    }
});