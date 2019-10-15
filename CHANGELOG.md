# Changelog

## v1.4.0 (15/10/2019)
![GitHub Releases](https://img.shields.io/github/downloads/AssetKid/raider-release/v1.4.0/total?style=for-the-badge)

### Changes

* Check if the device is online before starting a download.
* Auto update is no longer triggered if you are actively using the application.

### Bug Fixes

* Support highlights download for accounts with many highlight reels.
* Fixed a bug that caused downloads to stop when switching tabs on the settings drawer.
* Fixed an issue where adding an account failed on the portable version for new Raider users.
---

## v1.3.0 (06/10/2019)
![GitHub Releases](https://img.shields.io/github/downloads/AssetKid/raider-release/v1.3.0/total?style=for-the-badge)

### New Features
* Highlights download support.
* Show `Get Update` button on the main screen if an update is available.

### Changes
* `Updated` time is now updated after a successful download.
* Accounts drawer is no longer auto closed during mass update.
* Close any open dialogs during mass update.

### Bug Fixes
* Do not iterate profile page if `images` and `videos` are not selected.
* Prevent account list reset during auto mass update.
* Close 'more options` section during auto mass update (if it is expanded).
* Most edge case errors should no longer freeze the application.
---

## v1.2.0 (24/09/2019)
![GitHub Releases](https://img.shields.io/github/downloads/AssetKid/raider-release/v1.2.0/total?style=for-the-badge)

### API Updates
* Instagram has gradually introduced new API limits on certain endpoints. (e.g Fetching a user's info)
* In this update, the app will now stop downloads when a `429` error is detected.
* If you activate the `auto update` feature, we recommend using a longer interval and a low `mass update max post` number. The app will automatically retry failed downloads.
* Accounts that have not been updated in a while are given a higher priority.

### New Features
* Added system tray support. (**Experimental**)

![image](https://user-images.githubusercontent.com/40426812/65473277-c3e09900-de7f-11e9-9a37-deb73c032c1e.png)

* Added auto update. (**Experimental**)
* Deeplinking support. `raiderapp://` urls are now handled by Raider.

### Changes
* The `Stories` button is now disabled if no account is detected.
* Disabled accounts are now visible on the accounts list but the folder name and username are struckthrough.
* Better handling of `429 Too Many Request` error. The app will now stop downloads when Instagram starts rate limiting requests.
* Desktop shortcut is not created after install.

### Bug Fixes
* Fix height size for scrollable content.
* Correctly record the number of failed accounts during mass update.
---

## v1.1.0 (19/09/2019)
![GitHub Releases](https://img.shields.io/github/downloads/AssetKid/raider-release/v1.1.0/total?style=for-the-badge)

### New Features
* Option to change filename format.

<table>
  <tr>
    <td><strong>Unix & ID</strong> (Default)</td>
    <td>1567266047.224446266046251152</td>
  </tr>
  <tr>
    <td><strong>Date & ID</strong></td>
    <td>2019-08-31.224446266046251152</td>
  </tr>
  <tr>
    <td><strong>Date, Time & ID</strong></td>
    <td>2019-08-31-18h40m.224446266046251152</td>
  </tr>
</table>


### Bug Fixes
* Normalize timeout duration for all queries.
* Prevent duplicate queries using the same session.
* Improved detection & handling for disabled, deleted & blocked accounts.
---

## v1.0.5 (03/09/2019)
![GitHub Releases](https://img.shields.io/github/downloads/AssetKid/raider-release/v1.0.5/total?style=for-the-badge)

### Changes

* The 'Update All' feature now prioritizes accounts that have not been updated in a while.

### Bug Fixes

* Set `Save Folder` input field to read only.
* Fix a rendering bug that caused the app to be unresponsive after adding/deleting an account.
---

## v1.0.4 (26/08/2019)
![GitHub Releases](https://img.shields.io/github/downloads/AssetKid/raider-release/v1.0.4/total?style=for-the-badge)

### New Features
* Ability to set the maximum number of posts to fetch during mass update. (min 50 & max 200)
* You can now set the default action triggered when you click a user's account tile.

### Changes
* Reduced minimum height for the main window.
* Revamped donation section.
* Other minor style changes.

### Bug Fixes
* Increased profile and stories query request timeouts.
* The **Change** directory button is now disabled if a folder selection dialog is open.
* Other minor bug fixes.
---

## v1.0.3 (15/08/2019)
![GitHub Releases](https://img.shields.io/github/downloads/AssetKid/raider-release/v1.0.3/total?style=for-the-badge)

### New Features
* The application will now retry failed requests.

### Bug Fixes
* Fixed a 'user not found' error reported by a small number of users. The error seems to have stemmed from a backend change on Instagram's side.
* Fixed a bug that caused certian network requests to run indefinitely if a network error occurred during download.
---

## v1.0.2 (09/08/2019)
![GitHub Releases](https://img.shields.io/github/downloads/AssetKid/raider-release/v1.0.2/total?style=for-the-badge)

### New Features

* Allow only one running instance of the application.
* Ability to disable accounts. (Disabled accounts do not get updated during mass update)

![syMAMmZ0js](https://user-images.githubusercontent.com/40426812/62790872-ad030480-bad4-11e9-94d5-41e0f0c63bfa.gif)

### Bug Fixes

* Fixed a 403 error caused by a backend change on Instagram servers.
* The program menu no longer appears when you press the `alt` button.
* Other minor bug fixes and style changes.

---

## v1.0.1 (22/07/2019)
![GitHub Releases](https://img.shields.io/github/downloads/AssetKid/raider-release/v1.0.1/total?style=for-the-badge)

### Bug Fixes

- Complete download if a user has no media on their profile.
---

## v1.0.0 (08/07/2019)
![GitHub Releases](https://img.shields.io/github/downloads/AssetKid/raider-release/v1.0.0/total?style=for-the-badge)

Initial Release 🎉
