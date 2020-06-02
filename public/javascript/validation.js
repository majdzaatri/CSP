//Signup//
const firstName=document.getElementById('firstname')
const lastName=document.getElementById('lastname')
const email=document.getElementById('email')
const password=document.getElementById('password')
const confirmPass=document.getElementById('confirmPass')
const promocode=document.getElementById('promocode')
const submit=document.getElementById('submitBtn')


submit.addEventListener('click' , (e) => {
  if(!checkInput()){
     e.preventDefault();
  }      
})


function checkInput()
{
   let valid = 1;
    let regx=/^[a-z ,.'-,A-Z]+$/;
    if(!regx.test(lastName.value))
    {
        setErrorFor(lastName,' Last name must ');
        valid=0;
    }
    else
        setSuccessFor(lastName);
 
     if(!regx.test(firstName.value))
     {
        setErrorFor(firstName,'First name must be');
        valid=0;
     }
     else
        setSuccessFor(firstName);
 
   
      regx=/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
 
         if(!regx.test(email.value))
         {
            setErrorFor(email,' Email must be in xxx@yyy.zzz format');
            valid=0;
         }
         else
            setSuccessFor(email);
         
         let passwordregx= /^(?=.*\d)(?=.*[a-zA-Z]).{6,25}$/;
         if(password.value==='' || password.value===null)
         {
            setErrorFor(password,' Password is blank');
            valid=0;
         }
        else if(!passwordregx.test(password.value))
         {
            setErrorFor(password," Password's length must be at least 6 and must include at least 1 digit");
            valid=0;
         }
         else
            setSuccessFor(password);
         if(confirmPass.value==='' || confirmPass.value===null)
         {
            setErrorFor(confirmPass," Confirm Password is blank");
            valid=0;

         }
        else if(confirmPass.value!==password.value)
         {
             setErrorFor(confirmPass," Please make sure it matches your password");
            valid=0;

         }
         else {
            console.log('success');
               setSuccessFor(confirmPass);
        }
        if(!valid){
         return false;
        }
        return true;
}
function setErrorFor(input, message) {
	const formlabelgroup = input.parentElement;
   const small = formlabelgroup.querySelector('small');
   if(input==firstName||input==lastName)
   formlabelgroup.className = 'form-label-group error';
   else{
      formlabelgroup.className = 'form-label-group error row';
   }
   
	small.innerText = message;
}

function setSuccessFor(input) {
   const formlabelgroup = input.parentElement;
   if(input==firstName||input==lastName)
   formlabelgroup.className = 'form-label-group success';
      else{
      formlabelgroup.className = 'form-label-group success row';
   }

}