/*
TODO:

Make sure the 'Location' strings are formatted properly? (i.e. remove all '.' and '..')

Allow 'Options' to be passed through the 'find' function

Allow 'Extension' to be a StringTree ?

Allow wildcards?

Create a public Finder class

A way to set the default encoding and extensions
	-A way for it to run async?
	
Use:

StringTrees = require('string-trees').setDefaults({
	delimiter : '/'
})

Also in StringTrees - sort the keys by length so the largest strings get matched first
	
*/
const path = require('path'),
	fs = require('fs'),
	process = require('process'),
	just = require('basic-functions'),
	Resolution = require('resolution'),
	StringTrees = require('string-trees'),
	StringTreesOptions = {
		delimiter : '/'
	},
	//from https://github.com/nodejs/node/blob/master/lib/buffer.js
	ValidEncodings = [
		'ascii',
		'latin1',
		'binary',
		'utf8',
		'utf-8',
		'ucs2',
		'ucs-2',
		'utf16le',
		'utf-16le',
		'hex',
		'base64'
	],
	Defaults = {
		Base : ['$CURRENT'],
		Format : ['$BASE','$DIR','$NAME$EXT'],
		Extension : '.js',
		Encoding : 'utf8'
	},
	FileDir = (function(){
		function FileDir( Options ){
			this.Initial = path.resolve('.');
			this.Location = this.Initial + '/.';
			this.Base = Options.Base;
			this.Format = Options.Format;
			this.Encoding = Options.Encoding;
			this.Extension = Options.Extension;
		}
		
		FileDir.prototype.load = function( callback ){
			if( typeof callback !== 'function' ){
				throw new Error('Callback must be a function')
			}
			
			process.nextTick(function(){
				callback( new Error( 'There is no file path to load from') );
			})
		}
		
		FileDir.prototype.loadSync = function(){
			throw new Error( 'There is no file path to load from');
		}
		
		FileDir.prototype.find = find;
		
		return FileDir;
	})(),
	FilePath = (function(){
		//To create the FilePath object
		function FilePath( Location, Initial, Options ){
			this.Location = Location;
			this.Initial = Initial;
			
			this.Base = Options.Base;
			this.Format = Options.Format;
			this.Encoding = Options.Encoding;
			this.Extension = path.parse( this.Location ).ext || Options.Extension;
		}

		//To load the given FilePath object
		FilePath.prototype.load = function( callback ){
			
			if( typeof callback !== 'function' ){
				throw new Error('Callback must be a function')
			}
			
			fs.readFile( this.Location, this.Encoding, callback );
		}

		FilePath.prototype.loadSync = function(){
			return fs.readFileSync( this.Location, this.Encoding )
		}

		//To find a file from this FilePath object to the given filePath string
		FilePath.prototype.find = find;

		return FilePath;
	})();
	
//Synchronously test if the given filepath is a file or not
function isFile( filePath ){
	try{
		return fs.statSync( filePath ).isFile();
	}
	catch(e){
		return false;
	}
}

/*
	To validate the given value.
	If array, validate each element in the array and remove any non-string/non-array values
		- If the array has no elements, return the default value
	Otherwise, if it is not a string then return the default value
*/
function validateStringTree( value, def ){
	
	if( value instanceof Array ){
		value = value.map(function(x){ return validateStringTree(x,'') }).filter( just.echo )
		
		return value.length ?
			value :
			def;
	}
	
	return value && (value instanceof String || typeof value === 'string') ?
		[ value ] :
		def;
}

function validateExtension( str, def ){
	if( !(typeof str === 'string' || str instanceof String) ) return def;
	
	if( str[0] === '.' ) return str;

	return '.' + str;
}

function validateEncoding( str, def ){
	return (typeof str === 'string' || str instanceof String) && ValidEncodings.indexOf(str) >= 0 ?
		str :
		def;
}

function createSettingsObj( obj, base ){
	obj = obj instanceof Object ?
		obj :
		{};
	
	return {
		Base : validateStringTree( obj.Base, base.Base ),
		Format : validateStringTree( obj.Format, base.Format ),
		Extension : validateExtension(obj.Extension, base.Extension ),
		Encoding : validateEncoding(obj.Encoding, base.Encoding )
	};
}

//To add the given filepath to the given array of Paths if it does not already exist in the array
function addIfUnique( filePath, Paths ){
	if( Paths.indexOf( filePath ) === -1 ){
		Paths.push( filePath );
	}
}

//To add the given start/end strings to the given Ancestors object if the combination does not exist in the given Paths or Ancestors objects
function walkIfUnique( start, end, Paths, Ancestors ){
	var index;

	if( Paths.indexOf( path.normalize(path.resolve(start + '/' + end)) ) >= 0 ){
		return false;
	}
	
	index = Ancestors.Starts.indexOf( start );
	if( index === -1 ){
		Ancestors.Starts.push( start );
		Ancestors.Ends.push( [end] );
	}
	else{
		if( Ancestors.Ends[index].indexOf( end ) >= 0 ){
			return false;
		}
		Ancestors.Ends[index].push( end );
	}
	
	//Store the start string as the 'Base' if there is not already a base
	if( !Ancestors.Base ) Ancestors.Base = start;
	
	return true;
}

//To add all parent directories of the given filePath to the given Ancestors object until an parent is reached which already exists in the given Paths object
function traverseUp( filePath, Paths, Ancestors ){
	var index, start, end,
		split = filePath.split('^');
	
	//Throw an error if there is more than one ^ in the given filePath
	if( split.length > 2 ){
		throw new Error('Invalid File Path : ' + filePath)
	}
	
	//Get the start directory and the end string
	start = path.parse( split[0] ).dir;
	end = split[1];
	
	//If Ancestors has a Base which does not equal the current start directory, then collect all stored Ancestors values
	if( Ancestors.Base && Ancestors.Base !== start ){
		collectAncestors( Ancestors, Paths );
	}
	
	//Add each parent directory until one is reached that has already been added
	while( walkIfUnique( start, end, Paths, Ancestors )  ){
		//Get the parent directory
		start = path.parse( start ).dir;
	}
}

/*
	To combine all strings in the given Ancestors object and add to the given Paths object
	It then resets the Ancestors object
*/
function collectAncestors( Ancestors, Paths ){
	Ancestors.Starts.forEach(function( start, i ){
		Ancestors.Ends[i].forEach(function( end ){
			addIfUnique( path.normalize(path.resolve(start+end)), Paths );
		})
	});
	Ancestors.Starts = [];
	Ancestors.Ends = [];
	Ancestors.Base = '';
}

/*
	To get the list of possible paths to check from the given Format object, Map object
	If the path is absolute, then ignore $CURRENT and $INITIAL
*/
function getPaths( Format, Map, isAbsolute ){
	var Ancestors = {
			Starts : [],
			Ends : [],
			Base : ''
		},
		Paths = [];
	
	//Create a list of paths from the Format StringTree and the Map, and then handle each
	StringTrees( Format, Map, StringTreesOptions ).forEach(function( filePath ){
		
		if( isAbsolute && (filePath.indexOf('$CURRENT') >= 0 || filePath.indexOf('$INITIAL') >= 0) ) return;
	
		filePath = path.normalize(path.resolve( filePath ))
		
		//If it contains a ^, then add all parent listings until a repeat is found
		if( filePath.indexOf('^') >= 0 ){
			traverseUp( filePath, Paths, Ancestors );
			filePath = filePath.replace('^','');
		}
		else{
			collectAncestors( Ancestors, Paths );
		}
		
		addIfUnique( filePath, Paths );

	})
	
	collectAncestors( Ancestors, Paths )
	
	return Paths;
}

//To find the given filePath relative to the this FilePath
function find( filePath ){
	var i,
		pathData = path.parse( filePath ),
		isAbsolute = path.isAbsolute( filePath ),
		Map = isAbsolute ?
			{
				'$BASE' : pathData.dir,
				'$DIR' : '',
				'$NAME' : pathData.name,
				//If no extension, then use the Current one
				'$EXT' : pathData.ext || this.Extension
			} :
			{
				'$BASE' : this.Base,
				'$INITIAL' : this.Initial,
				'$CURRENT' : path.parse(this.Location).dir,
				'$DIR' : pathData.dir,
				'$NAME' : pathData.name,
				//If no extension, then use the Current one
				'$EXT' : pathData.ext || this.Extension
			},
		Paths = getPaths( this.Format, Map, isAbsolute );
	
	//Traverse the Paths until a valid path is Found
	for(i=0;i<Paths.length;i++){
		if( isFile( Paths[i] ) ){
			return Resolution.resolve( new FilePath( Paths[i], this.Initial, {
				Base : this.Base,
				Format : this.Format,
				Extension : this.Extension,
				Encoding : this.Encoding
			}) );
		}
	}
	
	return Resolution.reject( new Error( '\'' + filePath + '\' does not resolve to a file' ) );
}

function FindAFile( opts ){
	return new FileDir( createSettingsObj( opts, Settings ) );
};

FindAFile.defineSettings = function( obj ){
	Settings = createSettingsObj( obj, Settings );
	return FindAFile;
};

//Initialize the Settings
var Settings = createSettingsObj( null, Defaults );
	
module.exports = FindAFile;