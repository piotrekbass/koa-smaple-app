var koa = require('koa');
var route = require('koa-route');
var serve = require('koa-static');
var parse = require('co-body');
var _ = require('lodash');

var db = require('./lib/db');


var app = koa();
module.exports = app;

app.use(serve(__dirname + '/public'));

function * getProjects() {
    var projects = yield db.projects.find({});
    var votes = yield db.votes.find({});
    _.each(projects, function (project) {
        project.votes = _.chain(votes).filter(function (vote) {
            return vote.projectId.toString() === project._id.toString()
        }).size().value();
    });
    return projects;
}

app.use(route.get('/api/project', function * () {
    this.body = yield getProjects();
}));

app.use(route.get('/api/project/:id', function * (id) {
    this.body = yield db.projects.findById(id);
}));

app.use(route.post('/api/project', function * () {
    var postedProject = yield parse(this);

    var existingProject = yield db.projects.find({$or: [{name: postedProject.name}, {url: postedProject.url}]});
    if (existingProject && existingProject.length > 0) {
        this.body = {message: 'Project exists'};
        this.status = 400;
        return;
    }

    var newProject = {
        name: postedProject.name,
        url: postedProject.url
    };

    var savedProject = yield db.projects.insert(newProject);
    this.set('Location', '/api/project/' + savedProject._id);
    this.status = 201;
}));


app.listen(3000);
console.log("Working...");