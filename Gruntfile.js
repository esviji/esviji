module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    clean: {
      dist: {
        src: ['dist/']
      }
    },

    copy: {
      dist: {
        files: [
          { expand: true, cwd: 'src/', src: ['.htaccess', 'esviji-icon.png', 'favicon.ico', 'manifest.webapp'], dest: 'dist/' },
          { expand: true, cwd: 'src/', src: ['css/font/*'], dest: 'dist/' },
          { expand: true, cwd: 'src/', src: ['img/favicon.png', 'img/firefox-os/*', 'img/ios/*', 'img/windows-8/*'], dest: 'dist/' }
        ]
      }
    },

    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['src/js/vendor/*.js', 'src/js/esviji.js'],
        dest: 'dist/js/app.js'
      }
    },

    uglify: {
      dist: {
        options: {
          banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */'
        },
        files: {
          'dist/js/app.js': ['dist/js/app.js']
        }
      }
    },

    cssmin: {
      dist: {
        options: {
          banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */'
        },
        files: {
          'dist/css/styles.css': ['src/css/styles.css']
        }
      }
    },

    htmlmin: {
      dist: {
        options: {
          removeComments: true,
          collapseWhitespace: true
        },
        files: {
          'dist/index.html': 'src/index.html'
        }
      }
    },

    manifest: {
      generate: {
        options: {
          basePath: 'dist/',
          network: ['*'],
          verbose: true,
          timestamp: true
        },
        src: [
          'index.html',
          'favicon.ico',
          'img/favicon.png',
          'js/app.js',
          'css/styles.css',
          'css/font/*'
        ],
        dest: 'dist/manifest.appcache'
      }
    },

    sed: {
      version: {
        path: 'dist/',
        recursive: true,
        pattern: '%VERSION%',
        replacement: '<%= pkg.version %>'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-manifest');
  grunt.loadNpmTasks('grunt-sed');

  grunt.registerTask('default', ['clean:dist', 'copy:dist', 'concat:dist', 'uglify:dist', 'cssmin:dist', 'htmlmin:dist', 'manifest', 'sed:version']);
};
