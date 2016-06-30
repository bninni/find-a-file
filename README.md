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

**Note - ** This module uses <a href="https://github.com/bninni/string-trees">**StringTrees** Objects</a> as inputs and <a href="https://github.com/bninni/resolution">**Resolution** Objects</a> are outputs.

The module exports a function which will create a **Finder**.

You can then synchronously find file path relative to the location stored within that **Finder** based provided parameters.

The parameters are as follows:

  * **Base** - (_StringTree_) - The StringTree representation of the Base directories to use to search for Files
    * **Default** - `null`
  * **Format** - (_StringTree_) - The StringTree representation of the Format followed to create a file path from the user input
    * **Default** - `['$BASE','$DIR','$NAME$EXT']`
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

## Creating a Finder

```javascript
var finder = FindAFile()
```

This will create a 'Finder' in the current directory
**Note - ** Not the directory the script is stored in, but the directory the script was called from