# Concrete5 Packager
![Concrete5 Packager](https://github.com/mnakalay/concrete5-packager/raw/master/src/assets/concrete5-packager-logo-full.svg)
## Technical Description
This app is built with:

- [Electron](https://electronjs.org/ "Electron.org")
- [Quasar Framework](https://quasar-framework.org/ "Quasar Framework")
- [VueJs](https://vuejs.org/ "VueJs")
- Plenty of open source NodeJs projects (check package.json)

## How to run
From the command line first install all dependencies using NPM
> npm install

Then run the app from the command line by typing
> quasar dev -m electron

## Usage

**This Electron desktop app lets you zip Concrete5 packages.**

For now this is what it does:

You add as many Concrete5 roots as you want.

The app automatically lists all the packages for each root with their icon, name and handle.

You specify a destination folder or leave it on default.

When you select a package to zip, it is automatically copied to the destination folder in a "build" folder.

Some common files and folders are automatically ignored like .git, hidden files...

The app checks the package for missing `defined('C5_EXECUTE') or die("Access Denied.")` and adds the missing ones. Any "vendor" forlder in the package is automatically ignored for that step.

It then zips the package and puts it in a "release" folder inside the destination folder. The copy in the "build" folder is deleted.

## Settings
So far the app has the following settings:

- the destination folder
- whether to delete the build folder after zipping up the package
- whether to add th missing `defined('C5_EXECUTE') or die("Access Denied.")`


## To do
- Add a button to open the destination folder easily
- Add an option to exclude more files and folders
- Add an option to exclude files and folders per package
- Add an option to run Composer on the package
- Add an opion to only check the package (not zip) and give a detailed report
- Add the possibility to upload it directly to the marketplace