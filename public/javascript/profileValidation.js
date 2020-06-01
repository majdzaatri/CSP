const password=document.getElementById('newPassword')
const confirmPass=document.getElementById('confirmPass')
const submit=document.getElementById('changeBtn')
const formlabelgroup = document.getElementById('validation').parentElement;



submit.addEventListener('click' , (e) => {
   if(!checkInput()){
      e.preventDefault();  
   } 
})


function checkInput()
{
   var valid = 1;
   const passlength = formlabelgroup.querySelector('passlength').style.display = "block";
   const passnum= formlabelgroup.querySelector('passnum').style.display = "block";
   const passmatch = formlabelgroup.querySelector('passmatch').style.display = "block";
         let passwordregx= /^(?=.*\d)[a-zA-Z\d]{1,}$/;
         let passwordlength=/^.{6,25}$/;
         if(passwordlength.test(password.value)==0)
         {
            const passlength = formlabelgroup.querySelector('passlength').style.color='red';
            valid=0;
         }
         else{
            const passlength = formlabelgroup.querySelector('passlength').style.color='green';
        }
         if(passwordregx.test(password.value)==0)
         {
            const passnum= formlabelgroup.querySelector('passnum').style.color='red';
            valid=0;
         }
         else{
            const passnum= formlabelgroup.querySelector('passnum').style.color='green';
         }
        if(confirmPass.value!==password.value)
         {
            const passmatch = formlabelgroup.querySelector('passmatch').style.color='red';
            valid=0;
         }
         else{
            const passmatch = formlabelgroup.querySelector('passmatch').style.color='green';
        }

        return valid;
}
