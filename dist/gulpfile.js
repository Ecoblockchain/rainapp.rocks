var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');


var scripts = [
	'js/polyfills.js',
	'js/util.js', // TODO See if we need these
	'js/player.js',
	'js/remote.js',
	'js/db.js',
	'js/presenter.js'
];
// TODO tests
// TODO autobuild

gulp.task('default', function() {
	return gulp.src(scripts)
		.pipe(concat('main.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest('js/'));
});
