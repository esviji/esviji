<?php
header('Cache-Control: max-age=0, no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: Wed, 11 Jan 1984 05:00:00 GMT');
header('Content-type: text/cache-manifest');

$hashes = '';
$ignore = array('offline.appcache', 'offline.appcache.php');

function printFiles($path = '.', $level = 0) {
  global $hashes, $ignore;

  $dh = @opendir( $path );

  while (false !== ($file = readdir($dh))) {
    if((substr($file,0,1) !== '.') && !in_array($file, $ignore)) {
      if(is_dir($path.'/'.$file)) {
        printFiles($path.'/'.$file, $level + 1);
      } else {
        $hashes .= md5_file($path.'/'.$file);
        echo $path.'/'.$file."\n";
      }
    }
  }

  closedir($dh);
}

echo 'CACHE MANIFEST'."\n";
printFiles('.');
echo '#VersionHash: '.md5($hashes)."\n";
