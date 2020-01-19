/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var ObjectId = require('mongodb').ObjectId;

module.exports = function (app, db) {
  
  app.route('/api/threads/:board')
    .get(function (req,res) {
      var board = req.params.board || '';
      var jm = '{ "$match": { "board": { "$eq": "' + board + '" } } }';
    console.log(jm);
      db.collection('threads')
        .aggregate(
          JSON.parse(jm),
          { "$project": { "delete_password": 0, "reported": 0,"replies.delete_password": 0, "replies.reported": 0, "board": 0} }
        )
        .sort({bumped_on: -1})
        .limit(10)
        .toArray((err, doc) => {
          if(err) {
            res.json('could not find ' + err);
          } else {
            
            for (let i = 0; i < doc.length; i++) {
              var replies = [];
              doc[i].replycount = doc[i].replies.length;
              for (let j = 0; j < doc[i].replies.length; j++) {
                replies.push(doc[i].replies[j]);
                if (j === 2) break;
              }
              doc[i].replies = replies;
            }
            
            res.json(doc);
          }
      });
    })
  
    .put(function (req,res) {
      var board = req.params.board || '';
      var thread_id = req.body.thread_id || '';
      var jb = {_id: ObjectId(thread_id), board: board};
    console.log(jb);
      db.collection('threads').findOneAndReplace(jb, {$set: {reported: true}}, (err, doc) => {
        if(err) {
          res.json('could not update');
        } else if(doc.value === null) {
          res.json('incorrect board or id');
        } else {
          res.json('success');
        }
      });
    })
  
    .delete(function (req,res) {
      var board = req.params.board || '';
      var thread_id = req.body.thread_id || '';
      var delete_password = req.body.delete_password || '';
      var jb = {_id: ObjectId(thread_id), board: board, delete_password: delete_password};
    console.log(jb);
      db.collection('threads').findOneAndDelete(jb, (err, doc) => {
        if(err) {
          res.json('could not delete');
        } else if (doc.value === null) {
          res.json('incorrect password');
        } else {
          res.json('success');
        }
      });
    })
  
    .post(function (req,res) {
      var board = req.params.board || '';
      var text = req.body.text || '';
      var delete_password = req.body.delete_password || '';
      var date = new Date();
      var j = {board: board, text: text, delete_password: delete_password, created_on: date, bumped_on: date, reported: false, replies: []};
    console.log(j);
      db.collection('threads').insertOne(j, (err, doc) => {
        if(err || doc.value === null) {
            res.json('could not add');
        } else {
            res.redirect('/b/' + board);
        }
      });
    });
    
  app.route('/api/replies/:board')
    .get(function (req,res) {
      var board = req.params.board || '';
      var thread_id = req.query.thread_id || '';
      var jb = {_id: ObjectId(thread_id), board: board};
      db.collection('threads')
        .find(jb, { "delete_password": 0, "reported": 0,"replies.delete_password": 0, "replies.reported": 0, "board": 0})
        .toArray((err, doc) => {
          if(err) {
            res.json('could not find ' + err);
          } else {
            res.json(doc);
          }
      });
    })
  
    .put(function (req,res) {
      var board = req.params.board || '';
      var thread_id = req.body.thread_id || '';
      var reply_id = req.body.reply_id || '';
      var jb = {_id: ObjectId(thread_id), board: board};
    console.log(jb);
      db.collection('threads').find(jb).toArray((err, doc) => {
        if(err) {
          res.json('could not find');
        } else if (doc.length === 0) {
          res.json('incorrect board or some id');
        } else {
          var replies = doc[0].replies;
          for (let i = 0; i < replies.length; i++) {
            if (replies[i]._id.toString() === reply_id.toString()) {
              replies[i].reported = true;
            }
          }
          db.collection('threads').findOneAndReplace(jb, {$set: {replies: replies}}, (err, doc) => {
            if(err || doc.value === null) {
              res.json('could not update');
            } else {
              res.json('success');
            }
          });
        }
      });
    })
    
    .delete(function (req,res) {
      var board = req.params.board || '';
      var thread_id = req.body.thread_id || '';
      var reply_id = req.body.reply_id || '';
      var jb = {_id: ObjectId(thread_id), board: board};
    console.log(jb);
      db.collection('threads').find(jb).toArray((err, doc) => {
        if(err) {
          res.json('could not find');
        } else if (doc.length === 0) {
          res.json('incorrect password');       
        } else {
          var replies = doc[0].replies;
          for (let i = 0; i < replies.length; i++) {
            if (replies[i]._id.toString() === reply_id.toString()) {
              replies[i].text = '[deleted]';
            }
          }
          db.collection('threads').findOneAndReplace(jb, {$set: {replies: replies}}, (err, doc) => {
            if(err || doc.value === null) {
              res.json('could not update');
            } else {
              res.json('success');
            }
          });
        }
      });
    })
    
    .post(function (req,res) {
      var board = req.params.board || '';
      var thread_id = req.body.thread_id || '';
      var text = req.body.text || '';
      var delete_password = req.body.delete_password || '';
      var date = new Date();
      var jb = {_id: ObjectId(thread_id), board: board};
    console.log(jb);
      db.collection('threads').find(jb).toArray((err, doc) => {
        if(err) {
          res.json('could not find');
        } else if (doc.length === 0) {
          res.json('incorrect board or id');
        } else {
          var replies = doc[0].replies;
          var ju = {_id: new ObjectId(), text: text, created_on: date, delete_password: delete_password, reported: false};
          replies.push(ju);
          db.collection('threads').findOneAndReplace(jb, {$set: {bumped_on: date, replies: replies}}, (err, doc) => {
            if(err || doc.value === null) {
              res.json('could not update');
            } else {
              res.redirect('/b/' + board);
            }
          });
        }
      });
    });

};
