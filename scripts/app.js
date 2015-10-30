'use strict';

// declare modules
angular.module('Authentication', ['ngCookies']);
angular.module('Home', ['ui.bootstrap', 'ngCookies']);

angular.module('Monview', [
    'Authentication',
    'Home',
    'ngRoute',
    'ngCookies'
])

.config(['$routeProvider', function ($routeProvider) {

    $routeProvider
        .when('/login', {
            controller: 'LoginController',
            templateUrl: 'modules/authentication/views/login.html'
        })

        .when('/', {
            controller: 'HomeController',
            templateUrl: 'modules/home/views/home.html'
        })

        .otherwise({ redirectTo: '/login' });
}])

.run(['$rootScope', '$location', '$cookies', '$http',
    function ($rootScope, $location, $cookies, $http) {
        // keep user logged in after page refresh
        //$rootScope.globals = $cookieStore.get('globals') || {};
        //if ($rootScope.globals.currentUser) {
        //    $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.authdata; // jshint ignore:line
        //}

        $rootScope.$on('$locationChangeStart', function (event, next, current) {
            // redirect to login page if not logged in
            if ($location.path() !== '/login' && ( $cookies.get("userId") === undefined || $cookies.get("userId") == "" )) {
                $location.path('/login');
            }
        });
    }]);
