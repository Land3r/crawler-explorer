function extractHostname(url: string) {
    var hostname;
    //find & remove protocol (http, ftp, etc.) and get hostname
  
    if (url.indexOf("//") > -1) {
      hostname = url.split('/')[2];
    } else {
      hostname = url.split('/')[0];
    }
  
    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];
  
    validateDomain(hostname);
    return hostname;
  }
  
  const validateDomain = (s: string) => {
    try {
      new URL("https://" + s);
      return true;
    }
    catch(e) {
      console.error(e);
      return false;
    }
  };

  export { extractHostname }