function extractHostname(url: string) {
    let hostname;
 
    if (url.indexOf("//") > -1) {
      hostname = url.split('/')[2];
    } else {
      hostname = url.split('/')[0];
    }
  
    hostname = hostname.split(':')[0];
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