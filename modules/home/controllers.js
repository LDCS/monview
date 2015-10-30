'use strict';

angular.module('Home')

.controller('HomeController',
	    ['$scope', '$http', '$interval', '$location', '$cookies', '$log', '$timeout',
	     function ($scope, $http, $interval, $location, $cookies, $log, $timeout) {

		 $scope.user = $cookies.get("userId");
		 $scope.alerts = { editalertEnable :false, // For the alert edit tab
				   alertslistEnable: false, // For alert list tab
				   editrow : {},
				   alertrows : [],
				   editalert : { owner : "", status : "open", comment : "", ownerFullName : "Not selected", errorMessage : "" }
				 };
		 $scope.ops = {
		     history : [],
		     takeoverError : ""
		 };
		 $scope.meta = {
		     fullname: "",
		     numusers: "",
		     env: "",
		     operator: "",
		     upsince: "",
		     usermap: {}
		 };
		 var infogetter = function() {
		     
		     $http({
			 method: 'GET',
			 url: '/api/data',
			 params: { sid : "info",
				 rnd : new Date().getTime()
			       }
		     }).then(function(response) {
			 $scope.meta.fullname   = response.data.fullname;
			 $scope.meta.numusers   = response.data.numusers;
			 $scope.meta.env        = response.data.env;
			 $scope.meta.operator   = response.data.ops;
			 $scope.meta.upsince    = response.data.upsince;
			 // this callback will be called asynchronously
			 // when the response is available
		     }, function(response) {
			 // called asynchronously if an error occurs
			 // or server returns response with an error status.
			 if( $scope.meta.fullname == "" || $scope.meta.fullname === undefined ) {
			     $scope.meta.fullname   = "NA";
			     $scope.meta.numusers   = "NA";
			     $scope.meta.env        = "NA";
			     $scope.meta.operator   = "NA";
			     $scope.meta.upsince    = "NA";
			 }
		     });
		     
		 };
		 infogetter();
		 var intervalPromise = $interval(infogetter, 1000*60);
		 
		 var fetchAlertsPromise = null;
		 var alertgetter = function() {
		     $http({
			 method: 'GET',
			 url: '/api/data',
			 params: { sid : "getalerts" }
		     }).then(function(response) {
			 $scope.alerts.alertrows   = response.data;
		     }, function(response) {
			 // if getalerts fail due to change in hash cookie in getinfo, do it again after a pause
			 $timeout(function() {
			     $http({
				 method: 'GET',
				 url: '/api/data',
				 params: { sid : "getalerts" }
			     }).then(function(response) {
				 $scope.alerts.alertrows   = response.data;
			     }, function(response) {
				 $scope.alerts.alertrows = [];
			     })
			 }, 200);
		     });
		 };
		 $scope.fetchAlerts = function() {
		     $scope.alerts.editalertEnable = false;
		     if( fetchAlertsPromise != null ) {
			 $interval.cancel(fetchAlertsPromise);
			 alertgetter();
		     } else {
			 $timeout(alertgetter, 200);
		     }
		     alertgetter();
		     fetchAlertsPromise = $interval(alertgetter, 1000*60);
		 };

		 $scope.stopFetchAlerts = function() {
		     if( fetchAlertsPromise != null ) {
			 $interval.cancel(fetchAlertsPromise);
		     }
		 };

		 $scope.ownAlert = function(openat, subject) {  // Need subject for monim to send email
		     if($scope.user == "" || $scope.user === undefined) {
			 return;
		     }
		     var kvpl = encodeURIComponent("openat=" + openat + ";status=owned;owner=" + $scope.user + ";assigner=" + $scope.user + ";subject=" + subject);
		     $http({
			 method: 'GET',
			 url: '/api/data',
			 params: { sid : "editalert", editkvplist : kvpl },
			 headers: {'Content-Type': 'application/x-www-form-urlencoded'}
		     }).then(function(response) {
			 alertgetter();
		     }, function(response) {
			 $log.error("Error running ownAlert()");
		     });
		 };

		 $scope.killHome = function() {
		     $interval.cancel(intervalPromise);
		     $interval.cancel(fetchAlertsPromise);
		     $location.path('/login');
		 };

		 $scope.openEditAlertTab = function(alertrow) {
		     $scope.alerts.editalertEnable = true;
		     $scope.alerts.alertslistEnable = false;
		     $scope.alerts.editrow = alertrow;
		     $scope.setupEditTab();
		 };

		 $scope.setupEditTab = function() {
		     if( $scope.alerts.editrow.Owner != "" && $scope.alerts.editrow.Owner !== undefined ) {
			 $scope.alerts.editalert.owner = $scope.alerts.editrow.Owner;
			 $scope.alerts.editalert.ownerFullName = $scope.meta.usermap[$scope.alerts.editalert.owner];
		     } else {
			 $scope.alerts.editalert.owner = "";
			 $scope.alerts.editalert.ownerFullName = "Not assigned";
		     }
		     $scope.alerts.editalert.status = $scope.alerts.editrow.Status;
		     $scope.alerts.editalert.comment = $scope.alerts.editrow.Comment;
		 };
		 
		 $scope.closeEditAlertTab = function() {
		     $scope.alerts.editalertEnable = false;
		     $scope.alerts.alertslistEnable = true;
		 };

		 $scope.fetchUserList = function() {
		     $http({
			 method: 'GET',
			 url: '/api/data',
			 params: { sid : "getusers" }
		     }).then(function(response) {
			 $scope.meta.usermap = response.data;
			 $scope.setupEditTab();
		     }, function(response) {
			 $log.error("Error running fetchUserList()");
		     });
		 }

		 $scope.updateAlert = function() {
		     if($scope.user == "" || $scope.user === undefined) {
			 $scope.alerts.editalert.errorMessage = "Internal error : user is blank";
			 return;
		     }
		     if($scope.alerts.editrow.Openat == "" || $scope.alerts.editrow.Openat === undefined) {
			 $scope.alerts.editalert.errorMessage = "Internal error : Editrow's Openat is blank !";
			 return;
		     }
		     if($scope.alerts.editalert.status == "" || $scope.alerts.editalert.status === undefined ) {
			 $scope.alerts.editalert.status = $scope.alerts.editrow.Status;
		     }
		     if($scope.alerts.editalert.owner == "" || $scope.alerts.editalert.owner === undefined ) {
			 $scope.alerts.editalert.owner = $scope.alerts.editrow.Owner;
		     }
		     if($scope.alerts.editalert.status == "open" && $scope.alerts.editalert.comment == "") {
			 $scope.alerts.editalert.errorMessage = "Status is still 'open' and comment field did not change, so not doing anything";
			 return;
		     }
		     var kvpl = "openat=" + $scope.alerts.editrow.Openat + ";subject=" + $scope.alerts.editrow.Subject;
		     if($scope.alerts.editalert.status != "open") {
			 kvpl += (";status=" + $scope.alerts.editalert.status + ";owner=" + $scope.alerts.editalert.owner + ";assigner=" + $scope.user);
			 if($scope.alerts.editalert.status == "closed") {
			     kvpl += (";doneat=" + new Date().getTime().toString());
			 }
		     }

		     if($scope.alerts.editalert.comment != "") {
			 var comment = $scope.alerts.editalert.comment.replace(/,/g, ".").replace(/;/g, ".");
			 kvpl += (";comment=" + comment);
		     }
		     
		     kvpl = encodeURIComponent(kvpl);
		     $http({
			 method: 'GET',
			 url: '/api/data',
			 params: { sid : "editalert", editkvplist : kvpl },
			 headers: {'Content-Type': 'application/x-www-form-urlencoded'}
		     }).then(function(response) {
			 alertgetter();
			 $scope.alerts.editalert.errorMessage = "Successfully updated."
		     }, function(response) {
			 $log.error("Error running updateAlert()");
			 $scope.alerts.editalert.errorMessage = "Internal error in monim while updating the alert";
		     });
		 };

		 $scope.fetchOpsHistory = function() {
		     $http({
			 method: 'GET',
			 url: '/api/data',
			 params: { sid : "getopshistory" }
		     }).then(function(response) {
			 $scope.ops.history = response.data;
		     }, function(response) {
			 $log.error("Error running fetchOpsHistory()");
		     });
		 };

		 $scope.takeOver = function() {
		     $http({
			 method: 'GET',
			 url: '/api/data',
			 params: { sid : "addops" }
		     }).then(function(response) {
			 $scope.ops.takeoverError = "Sucessfully taken over.";
			 $scope.fetchOpsHistory();
		     }, function(response) {
			 $log.error("Error running takeOver()");
			 $scope.ops.takeoverError = "Server error on running takeOver()";
		     });
		 };


    }]);
