module.exports = function(grunt) {
  require("time-grunt")(grunt);
  require("grunt-lazyload")(grunt);

  grunt.lazyLoadNpmTasks("grunt-contrib-watch" ,"watch");
  grunt.lazyLoadNpmTasks("grunt-contrib-sass", "sass");
  grunt.lazyLoadNpmTasks("grunt-manifest", "manifest");
  grunt.lazyLoadNpmTasks("grunt-autoprefixer", "autoprefixer");
  grunt.lazyLoadNpmTasks("grunt-growl", "growl");
  grunt.lazyLoadNpmTasks("grunt-contrib-clean", "clean");
  grunt.lazyLoadNpmTasks("grunt-contrib-copy", "copy");
  grunt.lazyLoadNpmTasks("grunt-contrib-concat", "concat");
  grunt.lazyLoadNpmTasks("grunt-remove-logging", "removelogging");
  grunt.lazyLoadNpmTasks("grunt-contrib-uglify", "uglify");
  grunt.lazyLoadNpmTasks("grunt-contrib-cssmin", "cssmin");
  grunt.lazyLoadNpmTasks("grunt-usemin", ["useminPrepare", "usemin"]);
  grunt.lazyLoadNpmTasks("grunt-rev", "rev");
  grunt.lazyLoadNpmTasks("grunt-sed", "sed");
  grunt.lazyLoadNpmTasks("grunt-docco", "docco");
  grunt.lazyLoadNpmTasks("grunt-curl", "curl");

  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    watch: {
      sass: {
        options: {
          debounceDelay: 250
        },
        files: "src/sass/**",
        tasks: ["growl", "sass", "autoprefixer"]
      },
      manifest: {
        options: {
          debounceDelay: 250
        },
        files: ["src/index.html", "src/css/**", "src/js/**", "src/img/**"], //, "src/sounds/**"],
        tasks: ["growl", "manifest:src"]
      }
    },

    growl: {
      watch: {
        title : "Grunt",
        message : "Updating…"
      }
    },

    sass: {
      src: {
        options: {
          style: "expanded"
        },
        files: {
          "src/css/styles.css": "src/sass/styles.scss"
        }
      }
    },

    autoprefixer: {
      options: {
        browsers: ["> 1%", "last 2 versions", "android >= 2"]
      },
      no_dest: {
        src: "src/css/**/*.css"
      }
    },

    clean: {
      dist: {
        src: "dist/"
      }
    },

    copy: {
      dist: {
        files: [
          {
            expand: true,
            cwd: "src/",
            src: [
              "index.html",
              ".htaccess",
              "manifest.webapp",
              "manifest.json",
              "css/font/*",
              "img/*",
              "sounds/sprite.{mp3,ogg}",
              "js/vendor/analytics.js",
              "wow/*"
            ],
            dest: "dist/"
          },
          {
            expand: true,
            cwd: "src/favicons/",
            src: "*",
            dest: "dist/"
          }
        ]
      }
    },

    useminPrepare: {
      options: {
        dest: "dist/"
      },
      html: "src/index.html"
    },
    usemin: {
      html: "dist/index.html"
    },

    concat: {
      options: {
        separator: ";"
      }
    },

    removelogging: {
      dist: {
        src: "dist/js/app.js",
        options: {}
      }
    },

    uglify: {
      options: {
        banner: "/*! <%= pkg.name %> v<%= pkg.version %> - <%= grunt.template.today('yyyy-mm-dd') %> - Copyright (c) 1992-<%= grunt.template.today('yyyy') %> Nicolas Hoizey <nicolas@hoizey.com> */",
        report:"min"
      }
    },

    cssmin: {
      options: {
        banner: "/*! <%= pkg.name %> v<%= pkg.version %> - <%= grunt.template.today('yyyy-mm-dd') %> - Copyright (c) 1992-<%= grunt.template.today('yyyy') %> Nicolas Hoizey <nicolas@hoizey.com> */"
      }
    },

    rev: {
      options: {
        encoding: "utf8",
        algorithm: "md5",
        length: 8
      },
      assets: {
        files: [{
          src: [
            "dist/css/styles.css",
            "dist/js/app.js"
          ]
        }]
      }
    },

    manifest: {
      src: {
        options: {
          basePath: "src/",
          network: ["*"],
          verbose: true,
          timestamp: true
        },
        src: [
          "js/**/*.js",
          "css/styles.css",
          "css/font/*",
          "sounds/*.{ogg,mp3}"
        ],
        dest: "src/manifest.appcache"
      },
      src_ios: {
        options: {
          basePath: "src/",
          network: ["*"],
          verbose: true,
          timestamp: true
        },
        src: [
          "js/**/*.js",
          "css/styles.css",
          "css/font/*"
        ],
        dest: "src/manifest_ios.appcache"
      },
      dist: {
        options: {
          basePath: "dist/",
          network: ["*"],
          verbose: true,
          timestamp: true
        },
        src: [
          "js/*.js",
          "css/*.css",
          "css/font/*",
          "sounds/*.{ogg,mp3}"
        ],
        dest: "dist/manifest.appcache"
      },
      dist_ios: {
        options: {
          basePath: "dist/",
          network: ["*"],
          verbose: true,
          timestamp: true
        },
        src: [
          "js/*.js",
          "css/*.css",
          "css/font/*"
        ],
        dest: "dist/manifest_ios.appcache"
      }
    },

    sed: {
      version: {
        path: "dist/",
        recursive: true,
        pattern: "%VERSION%",
        replacement: "<%= pkg.version %>"
      },
      description: {
        path: "dist/",
        recursive: true,
        pattern: "%DESCRIPTION%",
        replacement: "<%= pkg.description %>"
      },
      favicons: {
        path: "dist/index.html",
        pattern: "/favicons",
        replacement: ""
      }
    },

    docco: {
      debug: {
        src: ["src/js/esviji.js"],
        options: {
          output: "docs/"
        }
      }
    },

    curl: {
      google_analytics: {
        src: "http://www.google-analytics.com/analytics.js",
        dest: "src/js/vendor/analytics.js"
      },
      offline: {
        src: "https://raw2.github.com/HubSpot/offline/master/js/offline.js",
        dest: "src/js/vendor/offline.js"
      }
    }

  });

  grunt.registerTask("default", ["compile", "watch"]);
  grunt.registerTask("compile", ["growl", "sass", "autoprefixer", "manifest:src", "manifest:src_ios"]);
  grunt.registerTask("package", ["sass", "autoprefixer", "clean", "copy", "useminPrepare", "concat", "removelogging", "uglify", "cssmin", "rev", "usemin", "sed", "manifest:dist", "manifest:dist_ios", "docco"]);
  grunt.registerTask("vendors", ["curl"]);
};
