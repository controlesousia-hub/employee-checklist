 // Si l'insertion réussit, on déclenche l'appel vers Make.com pour l'e-mail
 if (!error) {
   try {
     await fetch('https://hook.eu1.make.com/vc26vbahahfqmv4t4w64pjy1538ov2z2', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         type: 'INSERT',
         record: {
           title: title.trim(),
           employee_name: employeeName.trim(),
           department,
         },
       }),
     });
   } catch (err) {
     console.log("Erreur lors de l'envoi du webhook :", err);
   }
 }