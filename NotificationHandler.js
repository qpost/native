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

import firebase from "react-native-firebase";

const handleNotification = async (notification) => {
	const localNotification = new firebase.notifications.Notification({
		shown_in_foreground: true
	})
		.setNotificationId(notification.notificationId)
		.setTitle(notification.title)
		.setBody(notification.body)
		.android.setChannelId("qpost")
		.android.setSmallIcon("ic_notification");

	firebase.notifications().displayNotification(localNotification).then(() => {
		console.log("Notification shown");
	}).catch(reason => {
		console.warn("Failed to show notification", reason);
	})
};

export default handleNotification;