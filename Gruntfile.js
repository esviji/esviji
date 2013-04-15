module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-usemin');
  grunt.loadNpmTasks('grunt-rev');
  grunt.loadNpmTasks('grunt-manifest');
  grunt.loadNpmTasks('grunt-sed');
  grunt.loadNpmTasks('grunt-docco');
  grunt.loadNpmTasks('grunt-growl');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    watch: {
      less: {
        options: {
          debounceDelay: 250
        },
        files: 'src/less/*.less',
        tasks: ['growl:less', 'less']
      },
      manifest: {
        options: {
          debounceDelay: 250
        },
        files: ['src/index.html', 'src/css/**', 'src/js/**', 'src/img/**'],
        tasks: ['growl:manifest', 'manifest:src']
      }
    },

    growl: {
      less: {
        message : "LESS compilation…",
        title : "Grunt watcher"
      },
      manifest: {
        message : "Updating manifest.appcache…",
        title : "Grunt watcher"
      }
    },

    less: {
      src: {
        files: {
          "src/css/styles.css": "src/less/styles.less"
        }
      }
    },

    clean: {
      dist: {
        src: 'dist/'
      }
    },

    copy: {
      dist: {
        files: [
          { expand: true, cwd: 'src/', src: ['.htaccess', 'esviji-icon.png', 'favicon.ico', 'index.html', 'manifest.webapp'], dest: 'dist/' },
          { expand: true, cwd: 'src/', src: ['css/font/*'], dest: 'dist/' },
          { expand: true, cwd: 'src/', src: ['img/favicon.png', 'img/firefox-os/*', 'img/ios/*', 'img/windows-8/*'], dest: 'dist/' }
        ]
      }
    },

    useminPrepare: {
      options: {
        dest: 'dist/'
      },
      html: 'src/index.html'
    },
    usemin: {
      html: 'dist/index.html'
    },

    concat: {
      options: {
        separator: ';'
      }
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */'
      }
    },

    cssmin: {
      options: {
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */'
      }
    },

    rev: {
      options: {
        algorithm: 'md5',
        length: 8
      },
      assets: {
        files: [{
          src: [
            'dist/img/**/*.{jpg,jpeg,gif,png}',
            'dist/css/**/*.{css}',
            'dist/js/**/*.{js}'
          ]
        }]
      }
    },

    manifest: {
      src: {
        options: {
          basePath: 'src/',
          network: ['*'],
          verbose: true,
          timestamp: true
        },
        src: [
          'favicon.ico',
          'img/favicon.png',
          'js/**/*.js',
          'css/styles.css',
          'css/font/*'
        ],
        dest: 'src/manifest.appcache'
      },
      dist: {
        options: {
          basePath: 'dist/',
          network: ['*'],
          verbose: true,
          timestamp: true
        },
        src: [
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
    },

    docco: {
      debug: {
        src: ['src/js/esviji.js'],
        options: {
          output: 'docs/'
        }
      }
    }
  });

  grunt.registerTask('default', ['less', 'manifest:src', 'watch']);
  grunt.registerTask('package', ['less', 'clean', 'copy', 'useminPrepare', 'concat', 'uglify', 'cssmin', 'usemin', /*'rev',*/ 'manifest:dist', 'sed', 'docco']);
};