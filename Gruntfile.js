module.exports = function(grunt) {
  require('jit-grunt')(grunt, {
    useminPrepare: 'grunt-usemin',
    removelogging: 'grunt-remove-logging',
  });

  grunt.initConfig({
    packageFile: grunt.file.readJSON('package.json'),
    manifestFile: grunt.file.readJSON('src/manifest.json'),
    jsonldFile: grunt.file.read('src/json-ld.json'),
    modernizrFile: grunt.file.read('src/js/vendor/modernizr-custom.js'),

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
              '404.html',
              '.htaccess',
              '.well-known/*',
              'manifest.webapp',
              'manifest.json',
              'config.xml',
              'css/font/*',
              'img/*',
              'sounds/*',
              'js/vendor/analytics.js',
              'js/vendor/SVGEventListener-0.2.3.js',
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
        ],
        dest: 'src/manifest.appcache',
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
        ],
        dest: 'build/manifest.appcache',
      },
    },

    realFavicon: {
      favicons: {
        src: './src/img/esviji-logo.png',
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
                startUrl: 'https://play.esviji.com',
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
      title: {
        path: 'build/',
        recursive: true,
        pattern: '%TITLE%',
        replacement: '<%= packageFile.title %>',
      },
      description: {
        path: 'build/',
        recursive: true,
        pattern: '%DESCRIPTION%',
        replacement: '<%= packageFile.description %>',
      },
      jsonld: {
        path: 'build/',
        recursive: true,
        pattern: '%JSONLD%',
        replacement: '<%= jsonldFile %>',
      },
      inlinemodernizr: {
        path: 'build/',
        recursive: true,
        pattern: '%MODERNIZR%',
        replacement: '<%= modernizrFile %>',
      },
      // https://github.com/RealFaviconGenerator/realfavicongenerator/issues/207
      cleanManifestFilePaths: {
        path: 'build/manifest.json',
        pattern: '\\\\/',
        replacement: '/',
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
  grunt.registerTask('compile', ['growl', 'sass', 'autoprefixer', 'manifest:src']);
  grunt.registerTask('build', ['sass', 'autoprefixer', 'clean', 'copy:build', 'useminPrepare', 'concat', 'removelogging', 'uglify', 'cssmin', 'rev', 'usemin', 'realFavicon', 'sed', 'manifest:build']);
  grunt.registerTask('up', ['devUpdate']);
};
