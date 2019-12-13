/*
 * Copyright (C) 2018-2019 Gigadrive - All rights reserved.
 * https://gigadrivegroup.com
 * https://qpo.st
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://gnu.org/licenses/>
 */

/**
 * Sample React Native App with Firebase
 * https://github.com/invertase/react-native-firebase
 *
 * @format
 * @flow
 */

import React, {Component, useState} from 'react';
import {WebView} from 'react-native-webview';
import firebase from "react-native-firebase";
import {client as clientInfo} from "./android/app/google-services";
import handleNotification from "./NotificationHandler";

// TODO(you): import any additional firebase services that you require for your app, e.g for auth:
//    1) install the npm package: `yarn add @react-native-firebase/auth@alpha` - you do not need to
//       run linking commands - this happens automatically at build time now
//    2) rebuild your app via `yarn run run:android` or `yarn run run:ios`
//    3) import the package here in your JavaScript code: `import '@react-native-firebase/auth';`
//    4) The Firebase Auth service is now available to use here: `firebase.auth().currentUser`

const CustomHeaderWebView = props => {
	const {uri, onLoadStart, ...restProps} = props;
	const [currentURI, setURI] = useState(props.source.uri);
	const newSource = {...props.source, uri: currentURI};

	return (
		<WebView
			{...restProps}
			source={newSource}
			onShouldStartLoadWithRequest={request => {
				// If we're loading the current URI, allow it to load
				if (request.url === currentURI) return true;
				// We're loading a new URL -- change state first
				setURI(request.url);
				return false;
			}}
		/>
	);
};

export default class App extends Component {
	token = null;
	firebaseToken = null;
	baseURL = "https://qpo.st";

	tokenRefreshListener = null;
	messageListener = null;

	removeNotificationDisplayedListener = () => {
	};
	removeNotificationListener = () => {
	};

	state = {
		url: this.baseURL + "/login"
	};

	componentDidMount() {
		this.setup();
		console.log("Google client info", JSON.stringify(clientInfo));
	}

	async setup() {
		// Build a channel
		const channel = new firebase.notifications.Android.Channel("qpost", "qpost Notifications", firebase.notifications.Android.Importance.Default)
			.setDescription("qpost Notification channel");

// Create the channel
		firebase.notifications().android.createChannel(channel);

		const fcmToken = await firebase.messaging().getToken();
		if (fcmToken) {
			// user has a device token
			this.handleFirebaseTokenChange(fcmToken);
		} else {
			// user doesn't have a device token yet
			console.warn("Failed to obtain Firebase Token");
		}

		this.tokenRefreshListener = firebase.messaging().onTokenRefresh(fcmToken => {
			// Process your token as required
			this.handleFirebaseTokenChange(fcmToken);
		});

		this.removeNotificationDisplayedListener = firebase.notifications().onNotificationDisplayed((notification) => {
			console.log("Displayed notification", notification);
			// Process your notification as required
			// ANDROID: Remote notifications do not contain the channel ID. You will have to specify this manually if you'd like to re-display the notification.
		});
		this.removeNotificationListener = firebase.notifications().onNotification((notification) => {
			console.log("Received notification", notification);
			// Process your notification as required
			handleNotification(notification);
		});

		/*await firebase.messaging().requestPermission();

		if(!messaging.isRegisteredForRemoteNotifications){
			await messaging.registerForRemoteNotifications();
		}

		messaging.getToken().then(token => {
			this.firebaseToken = token;
			console.log("Obtained Firebase token: " + token);

			this.handleFirebaseTokenChange(token);
		}).catch(reason => {
			console.warn("Failed to load Firebase token.", reason);
		});

		this.tokenRefreshListener = messaging.onTokenRefresh((token) => {
			this.firebaseToken = token;
		});

		this.messageListener = messaging.onMessage(MessageHandler);*/
	}

	componentWillUnmount() {
		this.removeNotificationDisplayedListener();
		this.removeNotificationListener();
	}

	handleTokenChange(token) {
		const oldToken = this.token;
		this.token = token || null;

		console.log("Detected qpost token change", token);

		if (oldToken === null && token !== null) {
			// logged in

			this.sendDataToServer();
		} else if (oldToken !== null && token === null) {
			// logged out
			// TODO
		}
	}

	handleFirebaseTokenChange(firebaseToken) {
		console.log("Detected Firebase token change", firebaseToken);
		this.firebaseToken = firebaseToken;

		this.sendDataToServer();
	}

	sendDataToServer() {
		if (this.token === null || this.firebaseToken === null) return;

		console.log("Sending data to server");

		let gcmKey = null;
		if (clientInfo[0].hasOwnProperty("api_key")) {
			clientInfo[0].api_key.forEach(key => {
				if (key.hasOwnProperty("current_key")) {
					gcmKey = key.current_key;
				}
			})
		}

		console.log("GCM Key", gcmKey);

		const subscription = {
			endpoint: "https://fcm.googleapis.com/fcm/send/" + this.firebaseToken,
			expirationTime: null,
			keys: {},
			GCM: gcmKey
		};

		fetch(this.baseURL + "/webpush/", {
			method: "POST",
			mode: "cors",
			credentials: "include",
			cache: "default",
			headers: new Headers({
				"Accept": "application/json",
				"Content-Type": "application/json",
				"Authorization": "Bearer " + this.token
			}),
			body: JSON.stringify({
				subscription,
				options: {}
			})
		}).then(() => {
			console.log("Webpush subscription succeeded");
		}).catch(reason => {
			console.warn("Failed to create webpush subscription", reason);
		})
	}

	render() {
		return (
			{/*<View style={styles.container}>
				<Text style={styles.welcome}>Welcome to React Native + Firebase!</Text>
				<Text style={styles.instructions}>To get started, edit App.js</Text>
				<Text style={styles.instructions}>{instructions}</Text>
				{!firebase.apps.length && (
					<Text style={styles.instructions}>
						{`\nYou currently have no Firebase apps registered, this most likely means you've not downloaded your project credentials. Visit the link below to learn more. \n\n ${firebaseCredentials}`}
					</Text>
				)}
			</View>*/
			},
				<CustomHeaderWebView source={{
					uri: this.state.url,
					headers: {
						"Q-User-Agent": "android"
					}
				}} onLoadStart={(navState) => {
					this.setState({url: navState.nativeEvent.url});
				}} onMessage={(event) => {
					let message = event.nativeEvent.data;

					console.log("Received message", message);

					if (message && typeof message === "string") {
						try {
							message = JSON.parse(message);

							if (message.type) {
								const type = message.type;

								switch (type) {
									case "token":
										this.handleTokenChange(message.token);
								}
							}
						} catch (e) {
							console.warn("An error occurred while parsing a message", e);
						}
					}
				}}/>
		);
	}
}
