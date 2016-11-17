# find-a-file
[![Build Status](https://travis-ci.org/bninni/find-a-file.svg?branch=master)](https://travis-ci.org/bninni/find-a-file)

Create a list of possible file locations based on user defined arguments and extract the first valid path

## Install
```
npm install find-a-file
```
or
```
npm install -g find-a-file
```

Then import the module into your program:

```javascript
var FindAFile = require('find-a-file')
```

## Basics

**Note -** This module uses <a href="https://github.com/bninni/string-trees">**StringTrees** Objects</a> as inputs and <a href="https://github.com/bninni/resolution">**Resolution** Objects</a> as outputs.

The module exports a function which will create a **Finder** based in the current directory.

You can then synchronously find a file path relative to the location stored within that **Finder** based on provided parameters.

The parameters are as follows:

  * **Base** - (_StringTree_) - The StringTree representation of the Base directories to use to search for Files
    * **Default** - `'$CURRENT'`
  * **Format** - (_StringTree_) - The StringTree representation of the file paths to search
    * **Default** - `['$BASE','$DIR','$NAME$EXT']`
	* **Note** - All elements within this StringTree will be automatically joined with a slash (/)
  * **Extension** - (_String_) - The extension to use to create a file path if one was not provided
    * **Default** - `'.js'`
  * **Encoding** - (_String_) - The encoding to use when loading a file
    * **Default** - `'utf8'`
  
All StringTrees will map the following values:
  * _$BASE_ - The provided **Base** parameter
  * _$INITIAL_ - The directory from which the **Finder** was created
  * _$CURRENT_ - The directory of which the file in this **Finder** resides
  * _$DIR_ - The directory as provided to the **Finder.find()** method
  * _$NAME_ - The name as provided to the **Finder.find()** method
  * _$EXT_ - The extension as provided to the **Finder.find()** method (or the default)

The default values can be overwritten with the following method:

**FindAFile.defineSettings( _opts_ )**
  * **opts** (_Object_) - The options to change (see above for parameters)
  
**Note -** This method returns the **exports** object, so it can be immediately invoked upon importing

```javascript
var FindAFile = require('find-a-file').defineSettings({ ... })
```
  
## Creating a Finder

A **Finder** can be created by invoking the module as a method:

**FindAFile( _opts_ )**
  * **opts** (_Object_) - The options to apply specific to this **Finder** (see above for parameters)
    * _Optional_ - If not provided, the default options will be used

This will create a **Finder** based in the current directory with the provided Options

**Note -** Not the directory the script is stored in, but the directory the script was called from

## Finding a File

First, create a **Finder**

```javascript
var finder = FindAFile()
```

To find a file, use:

**.find( _filepath_ )**
  * **_filepath_** (_String_) - The input to use to find a valid file path
  
Using the built-in **path** module, the provided **filepath** will be separated into 3 parameters:
  * **dir** - The directory in which the will reside
    * _Optional_ - If not provided, then it will not look for the file within any subdirectories
  * **name** - The name of the file to load
    * **Required**
  * **ext** - The extension of the file to look for
    * _Optional_ - If not provided, then it will use the extension stored within the **Finder**

	
```javascript
var file = finder.find('index')
```

Since only the default parameters were used, the program will look for a file at the following locations:

```javascript
['$CURRENT\index.js']
```

It returns a **Resolution** object, which is either _resolved_ to another **Finder** or _rejected_ with an **Error**

It will be resolved if a valid file path was found based on the given parameters

```javascript
if( file.resolved ){
	finder = file.value;
}
else{
	throw file.value;
}
```

The new **Finder** object will copy the parameters from the Initial **Finder** object with the exception of the following:
  * _$CURRENT_ will be updated to the directory in which the found file resides
  * _$EXT_ will be the extension of the found file

Here is another example in which the found file is in a different directory:

```javascript
file = finder.find('data\names.txt')

/*
Will check the following locations:
['$CURRENT\data\names.txt']
*/

finder = file.value

file = finder.find('index')

/*
Since we are using the new 'finder', it will check the following locations:
['$CURRENT\index.txt']
where '$CURRENT' is now '<previous $CURRENT>\data\'
*/

//To get the desired file from the new finder:
file = finder.find('..\index.js')
```

## Loading a File

A file can be loaded either synchronously or asynchronously:

**.load( callback )**
  *  Will run `fs.readFile( <filepath>, <encoding>, <callback> )`

**.loadSync()**
  *  Will return the result of `fs.readFileSync( <filepath>, <encoding> )`

## Adding Bases

You can set the **Base** directories to use to find a file:

```javascript
var finder = FindAFile({
  Base : [[
    ['C:','F:','$CURRENT'],
    ['home','other']
  ]]
})

finder.find('index')

/*
Will check the following locations:
[
  'C:\home\index.js',
  'C:\other\index.js',
  'F:\home\index.js',
  'F:\other\index.js',
  '$CURRENT\home\index.js',
  '$CURRENT\other\index.js'
]
*/
```

## Using a Different Format

You can set the **Format** to use to find a file:

```javascript
var finder = FindAFile({
  Format : [
    '$CURRENT',
    'node_modules',
	'$DIR',
    ['$NAME$EXT',[
	  ['$NAME','index$EXT']
	]
  ]
})

finder.find('test')

/*
Will check the following locations:
[
  '$CURRENT\node_modules\test.js',
  '$CURRENT\node_modules\test\index.js'
]
*/
```

You can insert a `^` anywhere within the the filepath to check all parent directories as well

It will stop searching when there is no parent directory or the parent directory has already been searched

```javascript
var finder = FindAFile({
  Format : [
    '$BASE^',
    'node_modules',
	'$NAME',
	'package.json'
  ]
})

finder.find('myModule')

/*
Will check the following locations:
[
  '$CURRENT\node_modules\myModule\package.json',
  '$CURRENT\..\node_modules\myModule\package.json',
  '$CURRENT\..\..\node_modules\myModule\package.json',
  ...
]
*/
```

## License

### MIT



  