module.exports = function(grunt) {
  require('time-grunt')(grunt);
  require('grunt-lazyload')(grunt);

  grunt.lazyLoadNpmTasks('grunt-contrib-watch', 'watch');
  grunt.lazyLoadNpmTasks('grunt-contrib-sass', 'sass');
  grunt.lazyLoadNpmTasks('grunt-manifest', 'manifest');
  grunt.lazyLoadNpmTasks('grunt-autoprefixer', 'autoprefixer');
  grunt.lazyLoadNpmTasks('grunt-growl', 'growl');
  grunt.lazyLoadNpmTasks('grunt-contrib-clean', 'clean');
  grunt.lazyLoadNpmTasks('grunt-contrib-copy', 'copy');
  grunt.lazyLoadNpmTasks('grunt-contrib-concat', 'concat');
  grunt.lazyLoadNpmTasks('grunt-remove-logging', 'removelogging');
  grunt.lazyLoadNpmTasks('grunt-contrib-uglify', 'uglify');
  grunt.lazyLoadNpmTasks('grunt-contrib-cssmin', 'cssmin');
  grunt.lazyLoadNpmTasks('grunt-usemin', ['useminPrepare', 'usemin']);
  grunt.lazyLoadNpmTasks('grunt-rev', 'rev');
  grunt.lazyLoadNpmTasks('grunt-sed', 'sed');
  grunt.lazyLoadNpmTasks('grunt-curl', 'curl');
  grunt.lazyLoadNpmTasks('grunt-dev-update', 'devUpdate');
  grunt.lazyLoadNpmTasks('grunt-real-favicon', 'realFavicon');

  grunt.initConfig({
    packageFile: grunt.file.readJSON('package.json'),
    manifestFile: grunt.file.readJSON('src/manifest.json'),

    watch: {
      sass: {
        options: {
          debounceDelay: 250,
        },
        files: 'src/sass/**',
        tasks: ['growl', 'sass', 'autoprefixer'],
      },
      manifest: {
        options: {
          debounceDelay: 250,
        },
        files: ['src/index.html', 'src/css/**', 'src/js/**', 'src/img/**', 'src/sounds/**'],
        tasks: ['growl', 'manifest:src'],
      },
    },

    growl: {
      watch: {
        title: 'Grunt',
        message: 'Updating…',
      },
    },

    sass: {
      src: {
        options: {
          style: 'expanded',
        },
        files: {
          'src/css/styles.css': 'src/sass/styles.scss',
        },
      },
    },

    autoprefixer: {
      options: {
        browsers: ['> 1%', 'last 2 versions', 'android >= 2'],
      },
      no_dest: {
        src: 'src/css/**/*.css',
      },
    },

    clean: {
      build: {
        src: 'build/',
      },
    },

    copy: {
      build: {
        files: [
          {
            expand: true,
            cwd: 'src/',
            src: [
              'index.html',
              '.htaccess',
              'manifest.webapp',
              'manifest.json',
              'css/font/*',
              'img/*',
              'sounds/*',
              'js/vendor/analytics.js',
              'wow/*',
            ],
            dest: 'build/',
          },
        ],
      },
      manifest: {
        files: [
          {
            expand: true,
            cwd: 'src/',
            src: [
              'manifest.json',
            ],
            dest: 'build/',
          },
        ],
      },
    },

    useminPrepare: {
      options: {
        dest: 'build/',
      },
      html: 'src/index.html',
    },
    usemin: {
      html: 'build/index.html',
    },

    concat: {
      options: {
        separator: ';',
      },
    },

    removelogging: {
      build: {
        src: 'build/js/app.js',
        options: {},
      },
    },

    uglify: {
      options: {
        banner: "/*! <%= packageFile.name %> v<%= packageFile.version %> - <%= grunt.template.today('yyyy-mm-dd') %> - Copyright (c) 1992-<%= grunt.template.today('yyyy') %> Nicolas Hoizey <nicolas@hoizey.com> */",
        report:'min',
      },
    },

    cssmin: {
      options: {
        banner: "/*! <%= packageFile.name %> v<%= packageFile.version %> - <%= grunt.template.today('yyyy-mm-dd') %> - Copyright (c) 1992-<%= grunt.template.today('yyyy') %> Nicolas Hoizey <nicolas@hoizey.com> */",
      },
    },

    rev: {
      options: {
        encoding: 'utf8',
        algorithm: 'md5',
        length: 8,
      },
      assets: {
        files: [
          {
            src: [
              'build/css/styles.css',
              'build/js/app.js',
            ],
          },
        ],
      },
    },

    manifest: {
      src: {
        options: {
          basePath: 'src/',
          network: ['*'],
          verbose: true,
          timestamp: true,
        },
        src: [
          'js/**/*.js',
          'css/styles.css',
          'css/font/*',
          'sounds/*.{ogg,mp3}',
        ],
        dest: 'src/manifest.appcache',
      },
      srcIos: {
        options: {
          basePath: 'src/',
          network: ['*'],
          verbose: true,
          timestamp: true,
        },
        src: [
          'js/**/*.js',
          'css/styles.css',
          'css/font/*',
        ],
        dest: 'src/manifest_ios.appcache',
      },
      build: {
        options: {
          basePath: 'build/',
          network: ['*'],
          verbose: true,
          timestamp: true,
        },
        src: [
          'js/*.js',
          'css/*.css',
          'css/font/*',
          'sounds/*.{ogg,mp3}',
        ],
        dest: 'build/manifest.appcache',
      },
      buildIos: {
        options: {
          basePath: 'build/',
          network: ['*'],
          verbose: true,
          timestamp: true,
        },
        src: [
          'js/*.js',
          'css/*.css',
          'css/font/*',
        ],
        dest: 'build/manifest_ios.appcache',
      },
    },

    realFavicon: {
      favicons: {
        src: './raw-sources/images/_sources/logo-esviji.png',
        dest: './build/',
        options: {
          iconsPath: '/',
          html: ['./build/index.html'],
          design: {
            ios: {
              pictureAspect: 'backgroundAndMargin',
              backgroundColor: '#cccccc',
              margin: '14%',
              appName: 'esviji',
            },
            desktopBrowser: {},
            windows: {
              appName: 'esviji',
              pictureAspect: 'noChange',
              backgroundColor: '#00aba9',
              onConflict: 'keep_existing',
            },
            androidChrome: {
              pictureAspect: 'shadow',
              themeColor: '#444444',
              manifest: {
                name: 'esviji',
                startUrl: 'http://play.esviji.com',
                display: 'standalone',
                orientation: 'notSet',
                existingManifest: '<%= manifestFile %>',
                onConflict: 'keep_existing',
              },
            },
            safariPinnedTab: {
              pictureAspect: 'silhouette',
              themeColor: '#444444',
            },
          },
          settings: {
            compression: 1,
            scalingAlgorithm: 'Mitchell',
            errorOnImageTooSmall: false,
          },
        },
      },
    },

    sed: {
      version: {
        path: 'build/',
        recursive: true,
        pattern: '%VERSION%',
        replacement: '<%= packageFile.version %>',
      },
      description: {
        path: 'build/',
        recursive: true,
        pattern: '%DESCRIPTION%',
        replacement: '<%= packageFile.description %>',
      },

      // https://github.com/RealFaviconGenerator/realfavicongenerator/issues/207
      cleanManifestFilePaths: {
        path: 'build/manifest.json',
        pattern: '\\\\/',
        replacement: '/',
      },
    },

    curl: {
      googleAnalytics: {
        src: 'http://www.google-analytics.com/analytics.js',
        dest: 'src/js/vendor/analytics.js',
      },
      offline: {
        src: 'https://raw.githubusercontent.com/HubSpot/offline/master/offline.js',
        dest: 'src/js/vendor/offline.js',
      },
    },

    devUpdate: {
      main: {
        options: {
          updateType: 'prompt',
          semver: false,
        },
      },
    },

  });

  grunt.registerTask('default', ['compile', 'watch']);
  grunt.registerTask('compile', ['growl', 'sass', 'autoprefixer', 'manifest:src', 'manifest:srcIos']);
  grunt.registerTask('build', ['sass', 'autoprefixer', 'clean', 'copy:build', 'useminPrepare', 'concat', 'removelogging', 'uglify', 'cssmin', 'rev', 'usemin', 'realFavicon', 'sed', 'manifest:build', 'manifest:buildIos']);
  grunt.registerTask('vendors', ['curl']);
  grunt.registerTask('up', ['devUpdate']);
};
