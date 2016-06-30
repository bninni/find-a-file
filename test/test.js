var process = require('process');

//Set the directory to be 'test'
process.chdir('test')

var FindAFile = require('../index.js'),
	vows = require('vows'),
    assert = require('assert');

vows.describe('Test').addBatch({
    'In the Current Directory': {
        'Finds a File': function () {
			var finder = FindAFile();
			assert.equal( finder.find('test').resolved, true )
			assert.equal( finder.find('test.js').resolved, true )
			assert.equal( finder.find('./test').resolved, true )
			assert.equal( finder.find('./test.js').resolved, true )
		},
		'Doesnt Find a File' : function () {
			var finder = FindAFile();
			assert.equal( finder.find('index').resolved, false )
			assert.equal( finder.find('test.txt').resolved, false )
		},
	},
	'In the Parent Directory' : {
		'Finds a File' : function () {
			var finder = FindAFile();
			assert.equal( finder.find('../index').resolved, true )
		},
		'Doesnt Find a File' : function () {
			var finder = FindAFile();
			assert.equal( finder.find('../test').resolved, false )
		},
		'Using the Format' : {
			'Finds a File' : function () {
				var opts = {
						Format : ['..','$DIR','$NAME$EXT']
					},
					finder = FindAFile( opts );
				assert.equal( finder.find('index').resolved, true )
				assert.equal( finder.find('test/test').resolved, true )
			},
			'Does Find a File' : function () {
				var opts = {
						Format : ['..','$DIR','$NAME$EXT']
					},
					finder = FindAFile( opts );
				assert.equal( finder.find('../index').resolved, false )
				assert.equal( finder.find('test').resolved, false )
			},
		},
		'Setting the Base' : {
			'Finds a File' : function () {
				var opts = {
						Base : '..'
					},
					finder = FindAFile( opts );
				assert.equal( finder.find('index').resolved, true )
				assert.equal( finder.find('test/test').resolved, true )
			},
			'Does Find a File' : function () {
				var opts = {
						Base : '..'
					},
					finder = FindAFile( opts );
				assert.equal( finder.find('../index').resolved, false )
				assert.equal( finder.find('test').resolved, false )
			},
		}
    },
	'Changing Extension' : {
		'Finds a File' : function (){
			var opts = {
					Extension : '.txt'
				},
				finder = FindAFile( opts );
				
			assert.equal( finder.find('../index.js').resolved, true )
			assert.equal( finder.find('test.js').resolved, true )
		},
		'Doesnt Find a File ' : function(){
			var opts = {
					Extension : '.txt'
				},
				finder = FindAFile( opts );
				
			assert.equal( finder.find('../index').resolved, false )
			assert.equal( finder.find('test').resolved, false )
		}
	},
	'Chaining' : {
		'Finds a File' : function () {
			var finder = FindAFile().find('../index').value
			
			assert.equal( finder.find('index').resolved, true )
			assert.equal( finder.find('test/test').resolved, true )
		},
		'Does Find a File' : function () {
			var finder = FindAFile().find('../index').value
			
			assert.equal( finder.find('../index').resolved, false )
			assert.equal( finder.find('test').resolved, false )
		},
		'Extension Chains' : function () {
			var opts = {
					Extension : '.txt'
				},
				finder = FindAFile( opts ).find('test.js').value;
				
			assert.equal( finder.find('../index').resolved, true )
		}
	},
	'Loading a File' : {
		'Cant Load Initial' : function (){
			var finder = FindAFile();
			assert.throws( function(){ finder.loadSync() } )
		},
		'Can Load Found File' : function (){
			var finder = FindAFile();
			assert.doesNotThrow( function(){ finder.find('test').value.loadSync() } )
		}
	}
}).exportTo(module);